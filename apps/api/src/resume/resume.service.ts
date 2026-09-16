import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type ResumeData, ResumeSchema, type ResumeStatus } from '@praman/schemas';
import { AiService } from '../ai/ai.service.js';
import { CandidateService } from '../candidate/candidate.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RESUME_GENERATOR_SYSTEM_PROMPT_V1 } from '../prompts/resume-generator.v1.js';
import { ValidationService } from '../validation/validation.service.js';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly candidateService: CandidateService,
    private readonly validationService: ValidationService,
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

    return resumeRecord;
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

    return resume;
  }
}
