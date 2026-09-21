import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type ResumeData, ResumeSchema, type ResumeStatus } from '@praman/schemas';
import { PrismaService } from '../../core/database/prisma.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import { AiService } from '../ai/ai.service.js';
import { RESUME_GENERATOR_SYSTEM_PROMPT_V1 } from '../ai/prompts/resume-generator.v1.js';
import { CandidateService } from '../candidate/candidate.service.js';
import { ValidationService } from '../validation/validation.service.js';
import { HtmlPdfService } from './html-pdf.service.js';
import { LatexService } from './latex.service.js';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly candidateService: CandidateService,
    private readonly validationService: ValidationService,
    private readonly latexService: LatexService,
    private readonly htmlPdfService: HtmlPdfService,
    private readonly storageService: StorageService,
  ) {}

  async generateAndValidate(jobDescriptionId: string, userId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();

    if (!jd) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found`);
    }

    if (userId && jd.userId !== userId) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found`);
    }

    const analysis = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
      jobDescriptionId: jd.id,
    }).first();

    if (!analysis) {
      throw new NotFoundException(`Analysis not found for JD ${jobDescriptionId}`);
    }

    const strategy = await this.prisma.client.orm.public.ResumeStrategy.where({
      candidateJdAnalysisId: analysis.id,
    }).first();

    if (!strategy) {
      throw new NotFoundException(`Strategy not found for JD ${jobDescriptionId}`);
    }

    const targetUserId = userId || jd.userId;
    const profile = await this.candidateService.getProfile(targetUserId);
    const sanitizedProfile = await this.candidateService.getSanitizedProfile(targetUserId);

    // Stage 4: Resume Generator call 1
    let resumeJson = await this.aiService.runStructuredCall<ResumeData>({
      systemPrompt: RESUME_GENERATOR_SYSTEM_PROMPT_V1,
      userPrompt: JSON.stringify({
        candidateProfile: sanitizedProfile,
        structuredJd: jd.structured,
        matchAnalysis: analysis.result,
        resumeStrategy: strategy.result,
      }),
      outputSchema: ResumeSchema,
      schemaName: 'Resume',
    });

    // Evidence cross-check validation
    let validationReport = this.validationService.validateResume(resumeJson, profile);

    // Auto-retry once on rejection with violation feedback (§8)
    if (validationReport.status === 'REJECTED' && validationReport.violations.length > 0) {
      this.logger.warn(
        `Initial resume generation failed evidence validation with ${validationReport.violations.length} violations. Triggering auto-retry...`,
      );

      try {
        const retryFeedback = `\n\nCRITICAL FIX NEEDED: The resume you generated had the following verified evidence discrepancies:\n${validationReport.violations.map((v) => `• ${v}`).join('\n')}\nRegenerate the resume strictly adhering to the candidate's exact profile records and source IDs.`;

        resumeJson = await this.aiService.runStructuredCall<ResumeData>({
          systemPrompt: RESUME_GENERATOR_SYSTEM_PROMPT_V1,
          userPrompt:
            JSON.stringify({
              candidateProfile: sanitizedProfile,
              structuredJd: jd.structured,
              matchAnalysis: analysis.result,
              resumeStrategy: strategy.result,
            }) + retryFeedback,
          outputSchema: ResumeSchema,
          schemaName: 'Resume',
        });

        // Re-validate
        validationReport = this.validationService.validateResume(resumeJson, profile);
      } catch (retryError: any) {
        this.logger.error(`Auto-retry resume generation failed: ${retryError.message}`);
      }
    }

    // Version History: Mark existing resumes for this strategy as not latest
    const priorResumes = await this.prisma.client.orm.public.Resume.where({
      resumeStrategyId: strategy.id,
    }).all();

    for (const old of priorResumes) {
      if (old.isLatest) {
        await this.prisma.client.orm.public.Resume.where({ id: old.id }).update({
          isLatest: false,
        });
      }
    }

    const version = priorResumes.length + 1;
    const statusToSave: ResumeStatus = validationReport.status;

    // Always create a new version (never overwrite)
    const resumeRecord = await this.prisma.client.orm.public.Resume.create({
      resumeStrategyId: strategy.id,
      resumeJson,
      validationReport,
      status: statusToSave,
      version,
      isLatest: true,
    });

    // Generate dynamic LaTeX code and upload to Cloudflare R2
    let texKey: string | null = null;
    let downloadUrl: string | null = null;
    if (resumeRecord) {
      try {
        const texContent = await this.latexService.generateLatex(resumeJson, profile);
        const ownerId = targetUserId || 'default-user';
        texKey = `resumes/${ownerId}/${(resumeRecord as any).id}/resume.tex`;

        await this.storageService.uploadFile(texKey, texContent, 'application/x-tex');
        downloadUrl = await this.storageService.getPresignedDownloadUrl(texKey, 3600); // 1-hour presigned URL
      } catch (storageErr: any) {
        this.logger.error(`LaTeX generation/upload failed: ${storageErr.message}`);
      }
    }

    return {
      ...resumeRecord,
      texKey,
      downloadUrl,
    };
  }

  async getLatestResume(jobDescriptionId: string, versionOrId?: string, userId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();

    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    if (userId && jd.userId !== userId) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found`);
    }

    const analysis = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
      jobDescriptionId: jd.id,
    }).first();

    if (!analysis) return null;

    const strategy = await this.prisma.client.orm.public.ResumeStrategy.where({
      candidateJdAnalysisId: analysis.id,
    }).first();

    if (!strategy) return null;

    let resume: any = null;

    if (versionOrId) {
      // Check if versionOrId is a number or UUID
      const versionNum = Number(versionOrId);
      if (!Number.isNaN(versionNum)) {
        resume = await this.prisma.client.orm.public.Resume.where({
          resumeStrategyId: strategy.id,
          version: versionNum,
        }).first();
      } else {
        resume = await this.prisma.client.orm.public.Resume.where({
          id: versionOrId,
        }).first();
      }
    }

    if (!resume) {
      resume = await this.prisma.client.orm.public.Resume.where({
        resumeStrategyId: strategy.id,
        isLatest: true,
      }).first();
    }

    if (!resume) {
      resume = await this.prisma.client.orm.public.Resume.where({
        resumeStrategyId: strategy.id,
      }).first();
    }

    if (!resume) return null;

    const ownerId = jd.userId || 'default-user';
    const texKey = `resumes/${ownerId}/${resume.id}/resume.tex`;
    let downloadUrl: string | null = null;
    try {
      downloadUrl = await this.storageService.getPresignedDownloadUrl(texKey, 3600);
    } catch {
      // ignore
    }

    return {
      ...resume,
      texKey,
      downloadUrl,
    };
  }

  async getResumeVersions(jobDescriptionId: string, userId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();

    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    if (userId && jd.userId !== userId) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found`);
    }

    const analysis = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
      jobDescriptionId: jd.id,
    }).first();

    if (!analysis) return [];

    const strategy = await this.prisma.client.orm.public.ResumeStrategy.where({
      candidateJdAnalysisId: analysis.id,
    }).first();

    if (!strategy) return [];

    const resumes = await this.prisma.client.orm.public.Resume.where({
      resumeStrategyId: strategy.id,
    }).all();

    return resumes
      .sort((a: any, b: any) => (b.version || 1) - (a.version || 1))
      .slice(0, 30)
      .map((r: any) => ({
        id: r.id,
        version: r.version,
        isLatest: Boolean(r.isLatest),
        status: r.status,
        createdAt: r.createdAt,
      }));
  }

  async getLatexSource(
    jobDescriptionId: string,
    templateId?: string,
    versionOrId?: string,
    userId?: string,
  ) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();
    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    const resumeRecord = await this.getLatestResume(jobDescriptionId, versionOrId, userId);
    if (!resumeRecord) {
      throw new NotFoundException(`Resume not found for job description ${jobDescriptionId}`);
    }

    const ownerId = jd.userId || 'default-user';
    const targetTemplate = templateId || 'modern-developer';
    const texKey = `resumes/${ownerId}/${resumeRecord.id}/${targetTemplate}.tex`;

    // Check if customized LaTeX exists in Cloudflare R2 for this template
    try {
      const storedTex = await this.storageService.getFileString(texKey);
      if (storedTex) {
        return storedTex;
      }
    } catch {
      // fallback to dynamic generator
    }

    const profile = await this.candidateService.getProfile(ownerId);
    return await this.latexService.generateLatex(
      resumeRecord.resumeJson as ResumeData,
      profile,
      targetTemplate,
    );
  }

  async updateLatexSource(
    jobDescriptionId: string,
    latex: string,
    templateId?: string,
    versionOrId?: string,
    userId?: string,
  ) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();
    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    const resumeRecord = await this.getLatestResume(jobDescriptionId, versionOrId, userId);
    if (!resumeRecord) {
      throw new NotFoundException(`Resume not found for job description ${jobDescriptionId}`);
    }

    const ownerId = jd.userId || 'default-user';
    const targetTemplate = templateId || 'modern-developer';
    const texKey = `resumes/${ownerId}/${resumeRecord.id}/${targetTemplate}.tex`;

    await this.storageService.uploadFile(texKey, latex, 'application/x-tex');
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(texKey, 3600);

    return {
      success: true,
      texKey,
      downloadUrl,
      updatedAt: new Date().toISOString(),
    };
  }

  async generateResumePdf(
    jobDescriptionId: string,
    templateId = 'modern-developer',
    versionOrId?: string,
    userId?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();
    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    const resumeRecord = await this.getLatestResume(jobDescriptionId, versionOrId, userId);
    if (!resumeRecord) {
      throw new NotFoundException(`Resume not found for job description ${jobDescriptionId}`);
    }

    const ownerId = jd.userId || 'default-user';
    const profile = await this.candidateService.getProfile(ownerId);
    const resumeData = resumeRecord.resumeJson as ResumeData;

    const buffer = await this.htmlPdfService.generatePdf(resumeData, profile, templateId);

    const rawName = resumeData.personal?.name || (profile as any)?.user?.name || 'Resume';
    const candidateName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const filename = `${candidateName || 'resume'}_${templateId}.pdf`;

    return { buffer, filename };
  }
}
