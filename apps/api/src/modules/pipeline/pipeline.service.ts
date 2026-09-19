import { Injectable, Logger, type MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MatchService } from '../match/match.service.js';
import { ResumeService } from '../resume/resume.service.js';
import { StrategyService } from '../strategy/strategy.service.js';

export type PipelineStage = 'match' | 'strategy' | 'resume' | 'pipeline';
export type PipelineStageStatus = 'started' | 'completed' | 'failed' | 'complete';

export interface PipelineStreamEvent {
  stage: PipelineStage;
  status: PipelineStageStatus;
  message: string;
  data?: unknown;
  timestamp: string;
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly matchService: MatchService,
    private readonly strategyService: StrategyService,
    private readonly resumeService: ResumeService,
  ) {}

  async runFullPipeline(jobDescriptionId: string, userId?: string) {
    this.logger.log(`Executing full end-to-end pipeline for JD: ${jobDescriptionId}`);

    const match = userId
      ? await this.matchService.runMatch(jobDescriptionId, userId)
      : await this.matchService.runMatch(jobDescriptionId);
    const strategy = userId
      ? await this.strategyService.runStrategy(jobDescriptionId, userId)
      : await this.strategyService.runStrategy(jobDescriptionId);
    const resume = userId
      ? await this.resumeService.generateAndValidate(jobDescriptionId, userId)
      : await this.resumeService.generateAndValidate(jobDescriptionId);

    return {
      jobDescriptionId,
      match,
      strategy,
      resume,
    };
  }

  streamFullPipeline(jobDescriptionId: string, userId?: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          this.logger.log(`Starting SSE streaming pipeline for JD: ${jobDescriptionId}`);

          // Stage 1: Match Analysis
          subscriber.next({
            data: {
              stage: 'match',
              status: 'started',
              message: 'Analyzing candidate profile against job requirements...',
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });

          const match = userId
            ? await this.matchService.runMatch(jobDescriptionId, userId)
            : await this.matchService.runMatch(jobDescriptionId);

          subscriber.next({
            data: {
              stage: 'match',
              status: 'completed',
              message: 'Candidate match analysis successfully completed.',
              data: match,
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });

          // Stage 2: Resume Strategy
          subscriber.next({
            data: {
              stage: 'strategy',
              status: 'started',
              message: 'Formulating strategic positioning and bullet point angles...',
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });

          const strategy = userId
            ? await this.strategyService.runStrategy(jobDescriptionId, userId)
            : await this.strategyService.runStrategy(jobDescriptionId);

          subscriber.next({
            data: {
              stage: 'strategy',
              status: 'completed',
              message: 'Resume strategy and positioning formulated.',
              data: strategy,
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });

          // Stage 3: Resume Generation & Validation
          subscriber.next({
            data: {
              stage: 'resume',
              status: 'started',
              message: 'Generating tailored resume, compiling LaTeX, and verifying evidence...',
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });

          const resume = userId
            ? await this.resumeService.generateAndValidate(jobDescriptionId, userId)
            : await this.resumeService.generateAndValidate(jobDescriptionId);

          subscriber.next({
            data: {
              stage: 'resume',
              status: 'completed',
              message: 'Resume generated and verified against candidate evidence.',
              data: resume,
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });

          // Final Completion Event
          subscriber.next({
            data: {
              stage: 'pipeline',
              status: 'complete',
              message: 'End-to-end pipeline completed successfully.',
              data: {
                jobDescriptionId,
                match,
                strategy,
                resume,
              },
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });

          subscriber.complete();
        } catch (error: any) {
          this.logger.error(
            `Pipeline stream failed for JD ${jobDescriptionId}: ${error.message}`,
            error.stack,
          );
          subscriber.next({
            data: {
              stage: 'pipeline',
              status: 'failed',
              message: error.message || 'An error occurred during pipeline execution.',
              timestamp: new Date().toISOString(),
            } satisfies PipelineStreamEvent,
          });
          subscriber.complete();
        }
      })();
    });
  }
}
