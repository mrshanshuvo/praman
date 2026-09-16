import { describe, expect, it } from 'vitest';
import { ResumeStrategySchema } from '../src/strategy.js';

describe('ResumeStrategySchema', () => {
  it('validates a complete resume strategy with all fields', () => {
    const fullStrategy = {
      emphasizedExperienceIds: ['exp-1'],
      emphasizedProjectIds: ['proj-1'],
      prioritizedSkills: ['TypeScript', 'Next.js', 'PostgreSQL'],
      gaps: ['No direct enterprise Kubernetes experience'],
      forbiddenClaims: ['Do not claim Kubernetes orchestration or microservice mesh ownership'],
      narrativeGuidance:
        'Focus heavily on pragmatic shipping, full-stack agility, and verified database latency reduction.',
    };

    const parsed = ResumeStrategySchema.parse(fullStrategy);
    expect(parsed.emphasizedExperienceIds).toEqual(['exp-1']);
    expect(parsed.prioritizedSkills).toHaveLength(3);
    expect(parsed.narrativeGuidance).toContain('Focus heavily on pragmatic shipping');
  });

  it('validates a minimal strategy with only narrative guidance and defaults', () => {
    const minimal = {
      narrativeGuidance: 'Highlight core strengths and remain strictly factual.',
    };

    const parsed = ResumeStrategySchema.parse(minimal);
    expect(parsed.narrativeGuidance).toBe(minimal.narrativeGuidance);
    expect(parsed.emphasizedExperienceIds).toEqual([]);
    expect(parsed.emphasizedProjectIds).toEqual([]);
    expect(parsed.prioritizedSkills).toEqual([]);
    expect(parsed.gaps).toEqual([]);
    expect(parsed.forbiddenClaims).toEqual([]);
  });

  it('rejects strategy missing narrativeGuidance or with invalid array fields', () => {
    expect(() => ResumeStrategySchema.parse({})).toThrow();
    expect(() =>
      ResumeStrategySchema.parse({
        narrativeGuidance: 'Guidance',
        forbiddenClaims: null,
      }),
    ).toThrow();
  });
});
