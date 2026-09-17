import { Injectable, NotFoundException } from '@nestjs/common';
import { type StructuredJd, StructuredJdSchema } from '@praman/schemas';
import { AiService } from '../ai/ai.service.js';
import { CandidateService } from '../candidate/candidate.service.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { JD_ANALYZER_SYSTEM_PROMPT_V1 } from '../ai/prompts/jd-analyzer.v1.js';

@Injectable()
export class JobDescriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly candidateService: CandidateService,
  ) {}

  async createAndAnalyze(rawText: string) {
    const user = await this.candidateService.getDefaultUser();

    // Run Stage 1: JD Analyzer
    const structured = await this.aiService.runStructuredCall<StructuredJd>({
      systemPrompt: JD_ANALYZER_SYSTEM_PROMPT_V1,
      userPrompt: JSON.stringify({ rawText }),
      outputSchema: StructuredJdSchema,
      schemaName: 'StructuredJd',
    });

    // Save to Database
    const jd = await this.prisma.client.orm.public.JobDescription.create({
      userId: user.id,
      rawText,
      structured,
    });

    return jd;
  }

  async getAllJds() {
    const user = await this.candidateService.getDefaultUser();
    const jds = await this.prisma.client.orm.public.JobDescription.where({
      userId: user.id,
    })
      .include('analysis')
      .all();

    return jds;
  }

  async getJdById(id: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id })
      .include('analysis')
      .first();

    if (!jd) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    // Fetch deep relations if analysis exists
    let analysisWithStrategy: any = null;
    if (jd.analysis) {
      analysisWithStrategy = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
        id: jd.analysis.id,
      })
        .include('strategy')
        .first();

      if (analysisWithStrategy?.strategy) {
        const strategyWithResume = await this.prisma.client.orm.public.ResumeStrategy.where({
          id: analysisWithStrategy.strategy.id,
        })
          .include('resume')
          .first();

        analysisWithStrategy.strategy = strategyWithResume;
      }
    }

    return {
      ...jd,
      analysis: analysisWithStrategy || jd.analysis,
    };
  }
}
