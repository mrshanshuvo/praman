import { Injectable, NotFoundException } from '@nestjs/common';
import { type ResumeStrategy, ResumeStrategySchema } from '@praman/schemas';
import { PrismaService } from '../../core/database/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { RESUME_STRATEGY_SYSTEM_PROMPT_V1 } from '../ai/prompts/resume-strategy.v1.js';

@Injectable()
export class StrategyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async runStrategy(jobDescriptionId: string, userId?: string) {
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
      throw new NotFoundException(
        `Candidate-JD Analysis not found for JD ${jobDescriptionId}. Run match step first.`,
      );
    }

    // Run Stage 3: Resume Strategy
    const callResult =
      typeof this.aiService.runStructuredCallWithTelemetry === 'function'
        ? await this.aiService.runStructuredCallWithTelemetry<ResumeStrategy>({
            systemPrompt: RESUME_STRATEGY_SYSTEM_PROMPT_V1,
            userPrompt: JSON.stringify({
              structuredJd: jd.structured,
              matchAnalysis: analysis.result,
            }),
            outputSchema: ResumeStrategySchema,
            schemaName: 'ResumeStrategy',
          })
        : {
            data: await this.aiService.runStructuredCall<ResumeStrategy>({
              systemPrompt: RESUME_STRATEGY_SYSTEM_PROMPT_V1,
              userPrompt: JSON.stringify({
                structuredJd: jd.structured,
                matchAnalysis: analysis.result,
              }),
              outputSchema: ResumeStrategySchema,
              schemaName: 'ResumeStrategy',
            }),
            telemetry: {
              model: 'default',
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              durationMs: 0,
              costUsd: 0,
            },
          };

    const strategy = callResult.data;
    const telemetry = callResult.telemetry;

    // Check if strategy already exists
    let strategyRecord = await this.prisma.client.orm.public.ResumeStrategy.where({
      candidateJdAnalysisId: analysis.id,
    }).first();

    if (strategyRecord) {
      strategyRecord = await this.prisma.client.orm.public.ResumeStrategy.where({
        id: strategyRecord.id,
      }).update({
        result: strategy,
        aiModel: telemetry.model,
        promptTokens: telemetry.promptTokens,
        completionTokens: telemetry.completionTokens,
        durationMs: telemetry.durationMs,
        costUsd: telemetry.costUsd,
      });
    } else {
      strategyRecord = await this.prisma.client.orm.public.ResumeStrategy.create({
        candidateJdAnalysisId: analysis.id,
        result: strategy,
        aiModel: telemetry.model,
        promptTokens: telemetry.promptTokens,
        completionTokens: telemetry.completionTokens,
        durationMs: telemetry.durationMs,
        costUsd: telemetry.costUsd,
      });
    }

    if (this.prisma.client.orm.public.AiGenerationLog?.create) {
      await this.prisma.client.orm.public.AiGenerationLog.create({
        userId: jd.userId,
        jobDescriptionId: jd.id,
        stage: 'strategy',
        model: telemetry.model,
        promptTokens: telemetry.promptTokens,
        completionTokens: telemetry.completionTokens,
        totalTokens: telemetry.totalTokens,
        durationMs: telemetry.durationMs,
        costUsd: telemetry.costUsd,
      });
    }

    return strategyRecord;
  }
}
