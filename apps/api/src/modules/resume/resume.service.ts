import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type ResumeData, ResumeSchema, type ResumeStatus } from '@praman/schemas';
import { PrismaService } from '../../core/database/prisma.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import { AiService } from '../ai/ai.service.js';
import { RESUME_GENERATOR_SYSTEM_PROMPT_V1 } from '../ai/prompts/resume-generator.v1.js';
import { CandidateService } from '../candidate/candidate.service.js';
import { ValidationService } from '../validation/validation.service.js';
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
    private readonly storageService: StorageService,
  ) {}

  async generateAndValidate(jobDescriptionId: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();

    if (!jd) {
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

    const profile = await this.candidateService.getProfile();
    const sanitizedProfile = await this.candidateService.getSanitizedProfile();

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

    // Save Resume to Database
    let resumeRecord = await this.prisma.client.orm.public.Resume.where({
      resumeStrategyId: strategy.id,
    }).first();

    const statusToSave: ResumeStatus = validationReport.status;

    if (resumeRecord) {
      resumeRecord = await this.prisma.client.orm.public.Resume.where({
        id: resumeRecord.id,
      }).update({
        resumeJson,
        validationReport,
        status: statusToSave,
      });
    } else {
      resumeRecord = await this.prisma.client.orm.public.Resume.create({
        resumeStrategyId: strategy.id,
        resumeJson,
        validationReport,
        status: statusToSave,
      });
    }

    // Generate dynamic LaTeX code and upload to Cloudflare R2
    let texKey: string | null = null;
    let downloadUrl: string | null = null;
    if (resumeRecord) {
      try {
        const texContent = await this.latexService.generateLatex(resumeJson, profile);
        const userId = jd.userId || 'default-user';
        texKey = `resumes/${userId}/${(resumeRecord as any).id}/resume.tex`;

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

  async getLatestResume(jobDescriptionId: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();

    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    const analysis = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
      jobDescriptionId: jd.id,
    }).first();

    if (!analysis) return null;

    const strategy = await this.prisma.client.orm.public.ResumeStrategy.where({
      candidateJdAnalysisId: analysis.id,
    }).first();

    if (!strategy) return null;

    const resume = await this.prisma.client.orm.public.Resume.where({
      resumeStrategyId: strategy.id,
    }).first();

    if (!resume) return null;

    const userId = jd.userId || 'default-user';
    const texKey = `resumes/${userId}/${resume.id}/resume.tex`;
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

  async getLatexSource(jobDescriptionId: string): Promise<string> {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();
    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    const resumeRecord = await this.getLatestResume(jobDescriptionId);
    if (!resumeRecord) {
      throw new NotFoundException(`Resume not found for job description ${jobDescriptionId}`);
    }

    const userId = jd.userId || 'default-user';
    const texKey = `resumes/${userId}/${resumeRecord.id}/resume.tex`;

    // Check if customized LaTeX exists in Cloudflare R2
    try {
      const storedTex = await this.storageService.getFileString(texKey);
      if (storedTex) {
        return storedTex;
      }
    } catch {
      // fallback to dynamic generator
    }

    const profile = await this.candidateService.getProfile();
    return await this.latexService.generateLatex(resumeRecord.resumeJson as ResumeData, profile);
  }

  async updateLatexSource(jobDescriptionId: string, latex: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();
    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    const resumeRecord = await this.getLatestResume(jobDescriptionId);
    if (!resumeRecord) {
      throw new NotFoundException(`Resume not found for job description ${jobDescriptionId}`);
    }

    const userId = jd.userId || 'default-user';
    const texKey = `resumes/${userId}/${resumeRecord.id}/resume.tex`;

    await this.storageService.uploadFile(texKey, latex, 'application/x-tex');
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(texKey, 3600);

    return {
      success: true,
      texKey,
      downloadUrl,
      updatedAt: new Date().toISOString(),
    };
  }
}
