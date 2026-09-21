import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type ApplicationStatus,
  type PaginationQueryDto,
  type StructuredJd,
  StructuredJdSchema,
} from '@praman/schemas';
import { PrismaService } from '../../core/database/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { JD_ANALYZER_SYSTEM_PROMPT_V1 } from '../ai/prompts/jd-analyzer.v1.js';
import { CandidateService } from '../candidate/candidate.service.js';

function normalizeJobText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

@Injectable()
export class JobDescriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly candidateService: CandidateService,
  ) {}

  async createAndAnalyze(rawText: string, targetUserId?: string, force = false) {
    let userId = targetUserId;
    if (!userId) {
      const user = await this.candidateService.getDefaultUser();
      userId = user.id;
    }

    if (!force) {
      const existingJds = await this.prisma.client.orm.public.JobDescription.where({
        userId,
      })
        .include('analysis')
        .all();

      const normalizedInput = normalizeJobText(rawText);
      const existingMatch = existingJds.find((existing: any) => {
        return normalizeJobText(existing.rawText) === normalizedInput;
      });

      if (existingMatch) {
        const structuredData = existingMatch.structured as unknown as Partial<StructuredJd> | null;
        throw new ConflictException({
          message: 'A job description with identical content was already analyzed',
          code: 'DUPLICATE_JD',
          existingJd: {
            id: existingMatch.id,
            jobTitle: structuredData?.jobTitle || 'Target Role',
            status: existingMatch.status,
            matchScore: existingMatch.analysis?.matchScore ?? null,
            createdAt: existingMatch.createdAt,
          },
        });
      }
    }

    // Run Stage 1: JD Analyzer
    const structured = await this.aiService.runStructuredCall<StructuredJd>({
      systemPrompt: JD_ANALYZER_SYSTEM_PROMPT_V1,
      userPrompt: JSON.stringify({ rawText }),
      outputSchema: StructuredJdSchema,
      schemaName: 'StructuredJd',
    });

    // Save to Database
    const jd = await this.prisma.client.orm.public.JobDescription.create({
      userId,
      rawText,
      structured,
    });

    return jd;
  }

  async getAllJds(targetUserId?: string, query?: PaginationQueryDto) {
    let userId = targetUserId;
    if (!userId) {
      const user = await this.candidateService.getDefaultUser();
      userId = user.id;
    }

    const whereClause: Record<string, any> = { userId };
    if (query?.status && query.status !== 'ALL') {
      whereClause.status = query.status;
    }

    // Fast count of total matched records
    const totalCount = (
      await this.prisma.client.orm.public.JobDescription.where(whereClause).select('id').all()
    ).length;

    const isExplicitAll = query?.all === true;
    const isExplicitPaginated = Boolean(query && (query.page != null || query.limit != null));
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 20));

    let jdsQuery =
      this.prisma.client.orm.public.JobDescription.where(whereClause).include('analysis');

    if (isExplicitPaginated && !isExplicitAll) {
      const offset = (page - 1) * limit;
      jdsQuery = jdsQuery.limit(limit).offset(offset);
    }

    let jds = await jdsQuery.all();

    // Default chronological ordering if requested
    jds = jds.sort((a: any, b: any) => {
      if (query?.sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Truncate heavy rawText for list and board cards (preserves preview snippet while slimming payload >95%)
    const items = jds.map((jd: any) => ({
      ...jd,
      rawText: jd.rawText ? jd.rawText.slice(0, 250) : '',
    }));

    // If no query parameters provided at all, return raw array for legacy callers
    if (!query) {
      return items;
    }

    const totalPages = isExplicitAll ? 1 : Math.max(1, Math.ceil(totalCount / limit));

    return {
      items,
      meta: {
        total: totalCount,
        page: isExplicitAll ? 1 : page,
        limit: isExplicitAll ? totalCount : limit,
        totalPages,
        hasNextPage: isExplicitAll ? false : page < totalPages,
        hasPrevPage: isExplicitAll ? false : page > 1,
      },
    };
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
        const strategyWithResumes = await this.prisma.client.orm.public.ResumeStrategy.where({
          id: analysisWithStrategy.strategy.id,
        })
          .include('resumes')
          .first();

        if (strategyWithResumes) {
          const resumes = strategyWithResumes.resumes || [];
          const latestResume = resumes.find((r: any) => r.isLatest) || resumes[0] || null;
          analysisWithStrategy.strategy = {
            ...strategyWithResumes,
            resume: latestResume,
          };
        }
      }
    }

    return {
      ...jd,
      analysis: analysisWithStrategy || jd.analysis,
    };
  }

  async deleteJd(id: string, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id })
      .include('analysis')
      .first();

    if (!jd) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    if (jd.analysis) {
      const strategy = await this.prisma.client.orm.public.ResumeStrategy.where({
        candidateJdAnalysisId: jd.analysis.id,
      }).first();

      if (strategy) {
        const resumes = await this.prisma.client.orm.public.Resume.where({
          resumeStrategyId: strategy.id,
        }).all();

        for (const resume of resumes) {
          await this.prisma.client.orm.public.Resume.where({ id: resume.id }).delete();
        }

        await this.prisma.client.orm.public.ResumeStrategy.where({ id: strategy.id }).delete();
      }

      await this.prisma.client.orm.public.CandidateJdAnalysis.where({
        id: jd.analysis.id,
      }).delete();
    }

    await this.prisma.client.orm.public.JobDescription.where({ id }).delete();

    return {
      success: true,
      message: `Job description ${id} and all related pipeline data deleted`,
    };
  }

  async updateStatus(id: string, status: ApplicationStatus, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();

    if (!jd) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const updated = await this.prisma.client.orm.public.JobDescription.where({ id }).update({
      status,
    });

    return updated;
  }
}
