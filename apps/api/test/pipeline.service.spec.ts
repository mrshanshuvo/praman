import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, toArray } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchService } from '../src/modules/match/match.service.js';
import {
  PipelineService,
  type PipelineStreamEvent,
} from '../src/modules/pipeline/pipeline.service.js';
import { ResumeService } from '../src/modules/resume/resume.service.js';
import { StrategyService } from '../src/modules/strategy/strategy.service.js';

describe('PipelineService', () => {
  let service: PipelineService;
  let mockMatchService: any;
  let mockStrategyService: any;
  let mockResumeService: any;

  beforeEach(async () => {
    mockMatchService = {
      runMatch: vi.fn().mockResolvedValue({ id: 'match-1', matchScore: 92 }),
    };

    mockStrategyService = {
      runStrategy: vi
        .fn()
        .mockResolvedValue({ id: 'strategy-1', positioningAngle: 'Cloud Architect' }),
    };

    mockResumeService = {
      generateAndValidate: vi.fn().mockResolvedValue({ id: 'resume-1', status: 'VERIFIED' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineService,
        { provide: MatchService, useValue: mockMatchService },
        { provide: StrategyService, useValue: mockStrategyService },
        { provide: ResumeService, useValue: mockResumeService },
      ],
    }).compile();

    service = module.get<PipelineService>(PipelineService);
  });

  it('runFullPipeline should execute match, strategy, and resume sequentially', async () => {
    const result = await service.runFullPipeline('jd-123');

    expect(mockMatchService.runMatch).toHaveBeenCalledWith('jd-123');
    expect(mockStrategyService.runStrategy).toHaveBeenCalledWith('jd-123');
    expect(mockResumeService.generateAndValidate).toHaveBeenCalledWith('jd-123');

    expect(result.jobDescriptionId).toBe('jd-123');
    expect(result.match.id).toBe('match-1');
    expect(result.strategy.id).toBe('strategy-1');
    expect(result.resume.id).toBe('resume-1');
  });

  it('streamFullPipeline should emit progression events across all stages to completion', async () => {
    const stream$ = service.streamFullPipeline('jd-123');
    const events = await firstValueFrom(stream$.pipe(toArray()));

    expect(events.length).toBe(7);

    const payloads = events.map((e) => e.data as PipelineStreamEvent);

    expect(payloads[0].stage).toBe('match');
    expect(payloads[0].status).toBe('started');

    expect(payloads[1].stage).toBe('match');
    expect(payloads[1].status).toBe('completed');
    expect((payloads[1].data as any).id).toBe('match-1');

    expect(payloads[2].stage).toBe('strategy');
    expect(payloads[2].status).toBe('started');

    expect(payloads[3].stage).toBe('strategy');
    expect(payloads[3].status).toBe('completed');
    expect((payloads[3].data as any).id).toBe('strategy-1');

    expect(payloads[4].stage).toBe('resume');
    expect(payloads[4].status).toBe('started');

    expect(payloads[5].stage).toBe('resume');
    expect(payloads[5].status).toBe('completed');
    expect((payloads[5].data as any).id).toBe('resume-1');

    expect(payloads[6].stage).toBe('pipeline');
    expect(payloads[6].status).toBe('complete');
  });

  it('streamFullPipeline should emit failed stage event if a step throws', async () => {
    mockStrategyService.runStrategy.mockRejectedValue(new Error('AI Quota Exceeded'));

    const stream$ = service.streamFullPipeline('jd-fail');
    const events = await firstValueFrom(stream$.pipe(toArray()));

    const payloads = events.map((e) => e.data as PipelineStreamEvent);
    const lastEvent = payloads[payloads.length - 1];

    expect(lastEvent.stage).toBe('pipeline');
    expect(lastEvent.status).toBe('failed');
    expect(lastEvent.message).toContain('AI Quota Exceeded');
  });
});
