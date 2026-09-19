import { Injectable, NotFoundException } from '@nestjs/common';
import { calculateMatchScore, type MatchAnalysis, MatchAnalysisSchema } from '@praman/schemas';
import { PrismaService } from '../../core/database/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { CANDIDATE_MATCHER_SYSTEM_PROMPT_V1 } from '../ai/prompts/candidate-matcher.v1.js';
import { CandidateService } from '../candidate/candidate.service.js';

@Injectable()
export class MatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly candidateService: CandidateService,
  ) {}

  async runMatch(jobDescriptionId: string, userId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({
      id: jobDescriptionId,
    }).first();

    if (!jd) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found`);
    }

    if (userId && jd.userId !== userId) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found`);
    }

    const profile = await this.candidateService.getSanitizedProfile(userId || jd.userId);

    // Run Stage 2: Candidate Matcher
    const matchAnalysis = await this.aiService.runStructuredCall<MatchAnalysis>({
      systemPrompt: CANDIDATE_MATCHER_SYSTEM_PROMPT_V1,
      userPrompt: JSON.stringify({
        structuredJd: jd.structured,
        candidateProfile: profile,
      }),
      outputSchema: MatchAnalysisSchema,
      schemaName: 'MatchAnalysis',
    });

    const { score, label } = calculateMatchScore(matchAnalysis);

    // Check if an analysis already exists for this JD
    let analysisRecord = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
      jobDescriptionId: jd.id,
    }).first();

    if (analysisRecord) {
      analysisRecord = await this.prisma.client.orm.public.CandidateJdAnalysis.where({
        id: analysisRecord.id,
      }).update({
        result: matchAnalysis,
        matchScore: score,
        matchLabel: label,
      });
    } else {
      analysisRecord = await this.prisma.client.orm.public.CandidateJdAnalysis.create({
        jobDescriptionId: jd.id,
        result: matchAnalysis,
        matchScore: score,
        matchLabel: label,
      });
    }

    return analysisRecord;
  }
}
