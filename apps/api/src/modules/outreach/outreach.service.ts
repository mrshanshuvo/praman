import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type CoverLetter,
  CoverLetterSchema,
  type RecruiterEmail,
  RecruiterEmailSchema,
} from '@praman/schemas';
import { PrismaService } from '../../core/database/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { COVER_LETTER_SYSTEM_PROMPT_V1 } from '../ai/prompts/cover-letter.v1.js';
import { RECRUITER_EMAIL_SYSTEM_PROMPT_V1 } from '../ai/prompts/recruiter-email.v1.js';
import { CandidateService } from '../candidate/candidate.service.js';
import { ValidationService } from '../validation/validation.service.js';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly candidateService: CandidateService,
    private readonly validationService: ValidationService,
  ) {}

  private async getContext(jobDescriptionId: string, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();
    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found`);
    }

    const analysis = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
      jobDescriptionId: jd.id,
    }).first();
    if (!analysis)
      throw new NotFoundException(`Candidate analysis not found for JD ${jobDescriptionId}`);

    const strategy = await this.prisma.client.orm.public.ResumeStrategy.where({
      candidateJdAnalysisId: analysis.id,
    }).first();

    const resume = strategy
      ? await this.prisma.client.orm.public.Resume.where({
          resumeStrategyId: strategy.id,
          isLatest: true,
        }).first()
      : null;

    const candidateProfile = await this.candidateService.getProfile(targetUserId || jd.userId);

    return { jd, analysis, strategy, resume, candidateProfile };
  }

  async generateCoverLetter(
    jobDescriptionId: string,
    targetUserId?: string,
  ): Promise<{
    coverLetter: CoverLetter;
    coverLetterLatex: string;
    validation?: { numberFlags: any[]; violations: string[] };
  }> {
    this.logger.log(`Generating tailored cover letter for JD: ${jobDescriptionId}`);
    const { jd, analysis, strategy, resume, candidateProfile } = await this.getContext(
      jobDescriptionId,
      targetUserId,
    );

    const userPrompt = JSON.stringify({
      structuredJd: jd.structured,
      candidateProfile,
      matchAnalysis: analysis.result,
      strategy: strategy?.result || null,
    });

    const coverLetter = await this.aiService.runStructuredCall<CoverLetter>({
      systemPrompt: COVER_LETTER_SYSTEM_PROMPT_V1,
      userPrompt,
      outputSchema: CoverLetterSchema,
      schemaName: 'CoverLetter',
    });

    const coverLetterLatex = this.formatCoverLetterLatex(coverLetter);

    // Anti-hallucination validation on cover letter text
    const fullCoverLetterText = [
      coverLetter.opening,
      ...(coverLetter.bodyParagraphs || []),
      coverLetter.closing,
    ].join(' ');

    const validation = this.validationService.validateFreeText(
      fullCoverLetterText,
      candidateProfile,
      'Cover Letter',
    );

    if (validation.violations.length > 0 || validation.numberFlags.length > 0) {
      this.logger.warn(
        `Cover letter generated with ${validation.violations.length} violations and ${validation.numberFlags.length} numeric audit flags`,
      );
    }

    if (resume) {
      const coverLetterRecord = {
        coverLetter,
        coverLetterLatex,
        validation,
        generatedAt: new Date().toISOString(),
      };

      await this.prisma.client.orm.public.Resume.where({
        id: resume.id,
      }).update({
        coverLetterJson: coverLetterRecord,
      });
    }

    return { coverLetter, coverLetterLatex, validation };
  }

  async generateRecruiterEmail(
    jobDescriptionId: string,
    targetUserId?: string,
  ): Promise<{
    recruiterEmail: RecruiterEmail;
  }> {
    this.logger.log(`Generating recruiter outreach email for JD: ${jobDescriptionId}`);
    const { jd, analysis, strategy, resume, candidateProfile } = await this.getContext(
      jobDescriptionId,
      targetUserId,
    );

    const userPrompt = JSON.stringify({
      structuredJd: jd.structured,
      candidateProfile,
      matchAnalysis: analysis.result,
      strategy: strategy?.result || null,
    });

    const recruiterEmail = await this.aiService.runStructuredCall<RecruiterEmail>({
      systemPrompt: RECRUITER_EMAIL_SYSTEM_PROMPT_V1,
      userPrompt,
      outputSchema: RecruiterEmailSchema,
      schemaName: 'RecruiterEmail',
    });

    if (resume) {
      const recruiterEmailRecord = {
        recruiterEmail,
        generatedAt: new Date().toISOString(),
      };

      await this.prisma.client.orm.public.Resume.where({
        id: resume.id,
      }).update({
        recruiterEmailJson: recruiterEmailRecord,
      });
    }

    return { recruiterEmail };
  }

  async getOutreach(jobDescriptionId: string, targetUserId?: string) {
    const { resume } = await this.getContext(jobDescriptionId, targetUserId);
    if (!resume) {
      return {
        coverLetter: null,
        coverLetterLatex: null,
        coverLetterValidation: null,
        recruiterEmail: null,
      };
    }

    const coverLetterData: any =
      resume.coverLetterJson || (resume.resumeJson as any)?.outreach;
    const recruiterEmailData: any =
      resume.recruiterEmailJson || (resume.resumeJson as any)?.outreach;

    return {
      coverLetter: coverLetterData?.coverLetter || null,
      coverLetterLatex: coverLetterData?.coverLetterLatex || null,
      coverLetterValidation: coverLetterData?.validation || null,
      recruiterEmail: recruiterEmailData?.recruiterEmail || null,
    };
  }

  private formatCoverLetterLatex(coverLetter: CoverLetter): string {
    const body = (coverLetter.bodyParagraphs || []).map((p) => `${p}\n\n`).join('');

    const contactPieces: string[] = [];
    if (coverLetter.senderContact?.email) {
      contactPieces.push(
        `\\href{mailto:${coverLetter.senderContact.email}}{${coverLetter.senderContact.email}}`,
      );
    }
    if (coverLetter.senderContact?.phone) {
      contactPieces.push(coverLetter.senderContact.phone);
    }
    if (coverLetter.senderContact?.location) {
      contactPieces.push(coverLetter.senderContact.location);
    }

    const contactLine = contactPieces.join(' $\\cdot$ ');

    return `\\documentclass[11pt, a4paper]{article}
\\usepackage[top=2cm, bottom=2.5cm, left=2.5cm, right=2.5cm]{geometry}
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage{setspace}
\\setstretch{1.15}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\definecolor{primaryColor}{RGB}{0, 79, 144}
\\hypersetup{colorlinks=true, urlcolor=primaryColor}
\\pagestyle{empty}

\\begin{document}

{\\Large \\textbf{${coverLetter.senderName}}} \\\\[4pt]
${contactLine} \\\\[12pt]
\\rule{\\linewidth}{0.5pt} \\\\[16pt]

\\textbf{To:} ${coverLetter.recipientName} \\\\
\\textbf{Company:} ${coverLetter.companyName} \\\\
\\textbf{Position:} ${coverLetter.jobTitle} \\\\[16pt]

Dear ${coverLetter.recipientName}, \\\\[12pt]

${coverLetter.opening} \\\\[10pt]

${body}

${coverLetter.closing} \\\\[16pt]

${coverLetter.signOff} \\\\[24pt]
\\textbf{${coverLetter.senderName}}

\\end{document}
`.trim();
  }
}
