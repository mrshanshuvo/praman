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

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly candidateService: CandidateService,
  ) {}

  private async getContext(jobDescriptionId: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();
    if (!jd) throw new NotFoundException(`Job description ${jobDescriptionId} not found`);

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
        }).first()
      : null;

    const candidateProfile = await this.candidateService.getFullProfile(jd.userId);

    return { jd, analysis, strategy, resume, candidateProfile };
  }

  async generateCoverLetter(jobDescriptionId: string): Promise<{
    coverLetter: CoverLetter;
    coverLetterLatex: string;
  }> {
    this.logger.log(`Generating tailored cover letter for JD: ${jobDescriptionId}`);
    const { jd, analysis, strategy, resume, candidateProfile } =
      await this.getContext(jobDescriptionId);

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

    if (resume) {
      const currentJson: any = resume.resumeJson || {};
      const currentOutreach = currentJson.outreach || {};

      const updatedJson = {
        ...currentJson,
        outreach: {
          ...currentOutreach,
          coverLetter,
          coverLetterLatex,
          coverLetterGeneratedAt: new Date().toISOString(),
        },
      };

      await this.prisma.client.orm.public.Resume.where({
        id: resume.id,
      }).update({ resumeJson: updatedJson });
    }

    return { coverLetter, coverLetterLatex };
  }

  async generateRecruiterEmail(jobDescriptionId: string): Promise<{
    recruiterEmail: RecruiterEmail;
  }> {
    this.logger.log(`Generating recruiter outreach email for JD: ${jobDescriptionId}`);
    const { jd, analysis, strategy, resume, candidateProfile } =
      await this.getContext(jobDescriptionId);

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
      const currentJson: any = resume.resumeJson || {};
      const currentOutreach = currentJson.outreach || {};

      const updatedJson = {
        ...currentJson,
        outreach: {
          ...currentOutreach,
          recruiterEmail,
          recruiterEmailGeneratedAt: new Date().toISOString(),
        },
      };

      await this.prisma.client.orm.public.Resume.where({
        id: resume.id,
      }).update({ resumeJson: updatedJson });
    }

    return { recruiterEmail };
  }

  async getOutreach(jobDescriptionId: string) {
    const { resume } = await this.getContext(jobDescriptionId);
    if (!resume) return { coverLetter: null, recruiterEmail: null };

    const resumeJson: any = resume.resumeJson || {};
    const outreach = resumeJson.outreach || {};

    return {
      coverLetter: outreach.coverLetter || null,
      coverLetterLatex: outreach.coverLetterLatex || null,
      recruiterEmail: outreach.recruiterEmail || null,
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
