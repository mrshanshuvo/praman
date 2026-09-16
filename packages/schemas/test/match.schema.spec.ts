import { describe, expect, it } from 'vitest';
import { MatchAnalysisSchema } from '../src/match.js';

describe('MatchAnalysisSchema', () => {
  it('validates a complete match analysis with all fields', () => {
    const fullMatch = {
      strongMatches: ['TypeScript', 'Next.js', 'PostgreSQL'],
      partialMatches: ['AWS Cloud Architecture'],
      missingSkills: ['Kubernetes', 'Go'],
      experienceGaps: ['5+ years requested, candidate has 3 years'],
      educationGaps: [],
      relevantExperience: ['exp-1', 'exp-2'],
      relevantProjects: ['proj-1'],
      emphasize: ['Full-stack delivery', 'Database performance optimization'],
      doNotClaim: ['Kubernetes cluster administration', 'Solidity smart contracts'],
      explanation:
        'Candidate is an excellent match for core Next.js and backend requirements. Gaps in Kubernetes must be navigated transparently.',
    };

    const parsed = MatchAnalysisSchema.parse(fullMatch);
    expect(parsed.strongMatches).toHaveLength(3);
    expect(parsed.doNotClaim).toHaveLength(2);
    expect(parsed.explanation).toContain('Candidate is an excellent match');
  });

  it('validates a minimal match analysis with only explanation and defaults', () => {
    const minimal = {
      explanation: 'Candidate meets basic qualifications without overclaiming.',
    };

    const parsed = MatchAnalysisSchema.parse(minimal);
    expect(parsed.explanation).toBe(minimal.explanation);
    expect(parsed.strongMatches).toEqual([]);
    expect(parsed.partialMatches).toEqual([]);
    expect(parsed.missingSkills).toEqual([]);
    expect(parsed.experienceGaps).toEqual([]);
    expect(parsed.educationGaps).toEqual([]);
    expect(parsed.relevantExperience).toEqual([]);
    expect(parsed.relevantProjects).toEqual([]);
    expect(parsed.emphasize).toEqual([]);
    expect(parsed.doNotClaim).toEqual([]);
  });

  it('rejects match analysis missing explanation or invalid types', () => {
    expect(() => MatchAnalysisSchema.parse({})).toThrow();
    expect(() =>
      MatchAnalysisSchema.parse({
        explanation: 'Good fit',
        doNotClaim: { invalid: 'must be string array' },
      }),
    ).toThrow();
  });
});
