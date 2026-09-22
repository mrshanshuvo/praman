import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AiStageTelemetry,
  ApplicationNote,
  ApplicationStatus,
  ApplicationTracker,
  CreateMilestoneDto,
  CreateNoteDto,
  InterviewMilestone,
  JobTelemetrySummary,
  PaginationQueryDto,
  StructuredJd,
  UpdateApplicationTrackerDto,
  UserAiUsageSummary,
} from '@praman/schemas';
import { StructuredJdSchema } from '@praman/schemas';
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
    const callResult =
      typeof this.aiService.runStructuredCallWithTelemetry === 'function'
        ? await this.aiService.runStructuredCallWithTelemetry<StructuredJd>({
            systemPrompt: JD_ANALYZER_SYSTEM_PROMPT_V1,
            userPrompt: JSON.stringify({ rawText }),
            outputSchema: StructuredJdSchema,
            schemaName: 'StructuredJd',
          })
        : {
            data: await this.aiService.runStructuredCall<StructuredJd>({
              systemPrompt: JD_ANALYZER_SYSTEM_PROMPT_V1,
              userPrompt: JSON.stringify({ rawText }),
              outputSchema: StructuredJdSchema,
              schemaName: 'StructuredJd',
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

    const structured = callResult.data;
    const telemetry = callResult.telemetry;

    // Save to Database
    const jd = await this.prisma.client.orm.public.JobDescription.create({
      userId,
      rawText,
      structured,
      aiModel: telemetry.model,
      promptTokens: telemetry.promptTokens,
      completionTokens: telemetry.completionTokens,
      durationMs: telemetry.durationMs,
      costUsd: telemetry.costUsd,
    });

    if (this.prisma.client.orm.public.AiGenerationLog?.create) {
      await this.prisma.client.orm.public.AiGenerationLog.create({
        userId,
        jobDescriptionId: jd.id,
        stage: 'structuring',
        model: telemetry.model,
        promptTokens: telemetry.promptTokens,
        completionTokens: telemetry.completionTokens,
        totalTokens: telemetry.totalTokens,
        durationMs: telemetry.durationMs,
        costUsd: telemetry.costUsd,
      });
    }

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

  private ensureTracker(jd: any): ApplicationTracker {
    const rawTracker = (jd.tracker as Partial<ApplicationTracker>) || {};
    return {
      appliedDate: rawTracker.appliedDate ?? null,
      portalUrl: rawTracker.portalUrl ?? null,
      targetSalary: rawTracker.targetSalary ?? null,
      referralContact: rawTracker.referralContact ?? null,
      recruiterName: rawTracker.recruiterName ?? null,
      recruiterEmail: rawTracker.recruiterEmail ?? null,
      recruiterPhone: rawTracker.recruiterPhone ?? null,
      milestones: Array.isArray(rawTracker.milestones) ? rawTracker.milestones : [],
      notes: Array.isArray(rawTracker.notes) ? rawTracker.notes : [],
    };
  }

  async getTracker(id: string, targetUserId?: string): Promise<ApplicationTracker> {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }
    return this.ensureTracker(jd);
  }

  async updateTrackerDossier(id: string, dto: UpdateApplicationTrackerDto, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const currentTracker = this.ensureTracker(jd);
    const updatedTracker: ApplicationTracker = {
      ...currentTracker,
      ...Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined)),
    };

    await this.prisma.client.orm.public.JobDescription.where({ id }).update({
      tracker: updatedTracker as any,
    });

    return updatedTracker;
  }

  async addMilestone(id: string, dto: CreateMilestoneDto, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const tracker = this.ensureTracker(jd);
    const newMilestone: InterviewMilestone = {
      id: randomUUID(),
      roundNumber: dto.roundNumber ?? tracker.milestones.length + 1,
      stage: dto.stage,
      title: dto.title,
      scheduledAt: dto.scheduledAt ?? null,
      timezone: dto.timezone ?? null,
      status: dto.status ?? 'SCHEDULED',
      interviewer: dto.interviewer ?? null,
      meetingLink: dto.meetingLink ?? null,
      notes: dto.notes ?? null,
      questionsAsked: dto.questionsAsked ?? [],
      createdAt: new Date().toISOString(),
    };

    const updatedMilestones = [...tracker.milestones, newMilestone];
    const updatedTracker: ApplicationTracker = {
      ...tracker,
      milestones: updatedMilestones,
    };

    const updatePayload: Record<string, any> = {
      tracker: updatedTracker as any,
    };
    if (jd.status === 'SAVED' || jd.status === 'APPLIED') {
      updatePayload.status = 'INTERVIEWING';
    }

    await this.prisma.client.orm.public.JobDescription.where({ id }).update(updatePayload);

    return newMilestone;
  }

  async updateMilestone(
    id: string,
    milestoneId: string,
    dto: Partial<CreateMilestoneDto>,
    targetUserId?: string,
  ) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const tracker = this.ensureTracker(jd);
    const index = tracker.milestones.findIndex((m) => m.id === milestoneId);
    if (index === -1) {
      throw new NotFoundException(`Milestone with ID ${milestoneId} not found`);
    }

    const existing = tracker.milestones[index];
    const updatedMilestone: InterviewMilestone = {
      ...existing,
      ...Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined)),
    };

    tracker.milestones[index] = updatedMilestone;

    await this.prisma.client.orm.public.JobDescription.where({ id }).update({
      tracker: tracker as any,
    });

    return updatedMilestone;
  }

  async deleteMilestone(id: string, milestoneId: string, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const tracker = this.ensureTracker(jd);
    const updatedMilestones = tracker.milestones.filter((m) => m.id !== milestoneId);

    tracker.milestones = updatedMilestones;

    await this.prisma.client.orm.public.JobDescription.where({ id }).update({
      tracker: tracker as any,
    });

    return { success: true, milestoneId };
  }

  async addNote(id: string, dto: CreateNoteDto, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const tracker = this.ensureTracker(jd);
    const newNote: ApplicationNote = {
      id: randomUUID(),
      content: dto.content,
      tag: dto.tag ?? 'GENERAL',
      isPinned: dto.isPinned ?? false,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...tracker.notes];
    tracker.notes = updatedNotes;

    await this.prisma.client.orm.public.JobDescription.where({ id }).update({
      tracker: tracker as any,
    });

    return newNote;
  }

  async updateNote(id: string, noteId: string, dto: Partial<CreateNoteDto>, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const tracker = this.ensureTracker(jd);
    const index = tracker.notes.findIndex((n) => n.id === noteId);
    if (index === -1) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    const existing = tracker.notes[index];
    const updatedNote: ApplicationNote = {
      ...existing,
      ...Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined)),
    };

    tracker.notes[index] = updatedNote;

    await this.prisma.client.orm.public.JobDescription.where({ id }).update({
      tracker: tracker as any,
    });

    return updatedNote;
  }

  async deleteNote(id: string, noteId: string, targetUserId?: string) {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const tracker = this.ensureTracker(jd);
    const updatedNotes = tracker.notes.filter((n) => n.id !== noteId);

    tracker.notes = updatedNotes;

    await this.prisma.client.orm.public.JobDescription.where({ id }).update({
      tracker: tracker as any,
    });

    return { success: true, noteId };
  }

  async getJobTelemetry(id: string, targetUserId?: string): Promise<JobTelemetrySummary> {
    const jd = await this.prisma.client.orm.public.JobDescription.where({ id }).first();
    if (!jd) throw new NotFoundException(`Job description with ID ${id} not found`);
    if (targetUserId && jd.userId !== targetUserId) {
      throw new NotFoundException(`Job description with ID ${id} not found`);
    }

    const logs = this.prisma.client.orm.public.AiGenerationLog?.where
      ? await this.prisma.client.orm.public.AiGenerationLog.where({
          jobDescriptionId: id,
        }).all()
      : [];

    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalCostUsd = 0;
    let totalDurationMs = 0;

    const stages: AiStageTelemetry[] = logs.map((log: any) => {
      totalTokens += log.totalTokens || 0;
      promptTokens += log.promptTokens || 0;
      completionTokens += log.completionTokens || 0;
      totalCostUsd += log.costUsd || 0;
      totalDurationMs += log.durationMs || 0;

      return {
        stage: log.stage,
        model: log.model,
        promptTokens: log.promptTokens,
        completionTokens: log.completionTokens,
        totalTokens: log.totalTokens,
        durationMs: log.durationMs,
        costUsd: log.costUsd,
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : undefined,
      };
    });

    return {
      jobDescriptionId: id,
      totalTokens,
      promptTokens,
      completionTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      totalDurationMs,
      stages,
    };
  }

  async getUserAiUsage(targetUserId?: string): Promise<UserAiUsageSummary> {
    let userId = targetUserId;
    if (!userId) {
      const user = await this.candidateService.getDefaultUser();
      userId = user.id;
    }

    const logs = this.prisma.client.orm.public.AiGenerationLog?.where
      ? await this.prisma.client.orm.public.AiGenerationLog.where({
          userId,
        }).all()
      : [];

    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalCostUsd = 0;
    const stageBreakdown: Record<string, { count: number; tokens: number; costUsd: number }> = {};

    for (const log of logs) {
      const p = log.promptTokens || 0;
      const c = log.completionTokens || 0;
      const t = log.totalTokens || p + c;
      const cost = log.costUsd || 0;

      totalTokens += t;
      promptTokens += p;
      completionTokens += c;
      totalCostUsd += cost;

      const stage = log.stage || 'unknown';
      if (!stageBreakdown[stage]) {
        stageBreakdown[stage] = { count: 0, tokens: 0, costUsd: 0 };
      }
      stageBreakdown[stage].count += 1;
      stageBreakdown[stage].tokens += t;
      stageBreakdown[stage].costUsd = Number((stageBreakdown[stage].costUsd + cost).toFixed(6));
    }

    const quotaLimitTokens = 500_000;
    const quotaUsedPercentage = Math.min(
      100,
      Number(((totalTokens / quotaLimitTokens) * 100).toFixed(1)),
    );

    return {
      userId,
      totalTokens,
      promptTokens,
      completionTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      totalGenerations: logs.length,
      quotaLimitTokens,
      quotaUsedPercentage,
      stageBreakdown,
    };
  }
}
