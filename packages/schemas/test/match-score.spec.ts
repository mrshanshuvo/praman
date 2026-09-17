import { describe, expect, it } from 'vitest';
import { calculateMatchScore } from '../src/match';

describe('calculateMatchScore', () => {
  it('returns 0 score with Low Alignment on null or empty analysis', () => {
    const res1 = calculateMatchScore(null);
    expect(res1.score).toBe(0);
    expect(res1.label).toBe('Low Alignment');
    expect(res1.breakdown.skillCoverageRatio).toBe(0);

    const res2 = calculateMatchScore({});
    expect(res2.score).toBe(0);
    expect(res2.label).toBe('Low Alignment');
  });

  it('calculates 100% Exceptional match when all skills are strong and no gaps', () => {
    const res = calculateMatchScore({
      strongMatches: ['TypeScript', 'React', 'Node.js'],
      partialMatches: [],
      missingSkills: [],
      experienceGaps: [],
      educationGaps: [],
    });

    expect(res.score).toBe(100);
    expect(res.label).toBe('Exceptional');
    expect(res.breakdown.skillCoverageRatio).toBe(1);
    expect(res.breakdown.gapDeductions).toBe(0);
  });

  it('weights partial matches at 50%', () => {
    const res = calculateMatchScore({
      strongMatches: ['TypeScript'], // 1.0
      partialMatches: ['Go'], // 0.5
      missingSkills: [], // total skills = 2 => 1.5 / 2 = 75%
      experienceGaps: [],
      educationGaps: [],
    });

    expect(res.score).toBe(75);
    expect(res.label).toBe('Strong');
    expect(res.breakdown.skillCoverageRatio).toBe(0.75);
  });

  it('factors in missing skills properly', () => {
    const res = calculateMatchScore({
      strongMatches: ['React'], // 1.0
      partialMatches: [],
      missingSkills: ['Kubernetes'], // total 2 => 1.0 / 2 = 50%
      experienceGaps: [],
      educationGaps: [],
    });

    expect(res.score).toBe(50);
    expect(res.label).toBe('Moderate');
  });

  it('applies deductions for experience and education gaps', () => {
    // 100% skill coverage base
    const res = calculateMatchScore({
      strongMatches: ['Python', 'Django'],
      partialMatches: [],
      missingSkills: [],
      experienceGaps: ['Missing 2 years senior leadership'], // -8
      educationGaps: ['Missing Masters Degree'], // -5
    });

    // 100 - (8 + 5) = 87
    expect(res.breakdown.baseSkillScore).toBe(100);
    expect(res.breakdown.gapDeductions).toBe(13);
    expect(res.score).toBe(87);
    expect(res.label).toBe('Exceptional');
  });

  it('caps gap deductions at 35 points and bounds score to >= 0', () => {
    const res = calculateMatchScore({
      strongMatches: [],
      partialMatches: ['React'], // 0.5 / 10 = 5%
      missingSkills: Array.from({ length: 9 }, (_, i) => `Skill ${i}`),
      experienceGaps: ['Gap 1', 'Gap 2', 'Gap 3', 'Gap 4', 'Gap 5'], // 40 -> capped at 35
      educationGaps: ['Edu 1'],
    });

    expect(res.breakdown.gapDeductions).toBe(35);
    expect(res.score).toBe(0); // 5 - 35 = -30 bounded to 0
    expect(res.label).toBe('Low Alignment');
  });
});
