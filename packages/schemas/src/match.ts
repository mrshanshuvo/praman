import { z } from 'zod';

export const MatchAnalysisSchema = z.object({
  strongMatches: z
    .array(z.string())
    .default([])
    .describe('Verified direct alignments between candidate profile and JD requirements'),
  partialMatches: z
    .array(z.string())
    .default([])
    .describe('Related experiences or adjacent technologies where candidate has partial alignment'),
  missingSkills: z
    .array(z.string())
    .default([])
    .describe(
      'Required skills from JD that candidate has not demonstrated or marked as NOT_LEARNED',
    ),
  experienceGaps: z
    .array(z.string())
    .default([])
    .describe('Discrepancies in years of experience, domain, or leadership requirements'),
  educationGaps: z
    .array(z.string())
    .default([])
    .describe('Missing degrees or credentials required by the JD'),
  relevantExperience: z
    .array(z.string())
    .default([])
    .describe('Exact IDs of Experience records in candidate profile that are relevant'),
  relevantProjects: z
    .array(z.string())
    .default([])
    .describe('Exact IDs of Project records in candidate profile that are relevant'),
  emphasize: z
    .array(z.string())
    .default([])
    .describe('Key authentic candidate strengths to highlight for this specific JD'),
  doNotClaim: z
    .array(z.string())
    .default([])
    .describe(
      'Skills or responsibilities candidate lacks or has only at LEARNING level that MUST NOT be overstated',
    ),
  explanation: z
    .string()
    .describe(
      'Clear, honest, explainable synthesis of fit and strategic alignment (no vanity percentage or score)',
    ),
});
export type MatchAnalysis = z.infer<typeof MatchAnalysisSchema>;

export type MatchAlignmentTier = 'Exceptional' | 'Strong' | 'Moderate' | 'Low Alignment';

export interface MatchScoreBreakdown {
  strongMatchesCount: number;
  partialMatchesCount: number;
  missingSkillsCount: number;
  experienceGapsCount: number;
  educationGapsCount: number;
  skillCoverageRatio: number;
  baseSkillScore: number;
  gapDeductions: number;
}

export interface CalculatedMatchScore {
  score: number;
  label: MatchAlignmentTier;
  breakdown: MatchScoreBreakdown;
}

/**
 * Computes an auditable, deterministic match score (0-100%) from stage 2 match analysis.
 * Formula:
 *  - Skill Coverage Base: (strongMatches * 1.0 + partialMatches * 0.5) / totalSkills * 100
 *  - Deductions: 8 pts per experience gap, 5 pts per education gap (capped at 35 pts)
 *  - Final score is bounded to [0, 100]
 */
export function calculateMatchScore(
  analysis?: Partial<MatchAnalysis> | null,
): CalculatedMatchScore {
  if (!analysis) {
    return {
      score: 0,
      label: 'Low Alignment',
      breakdown: {
        strongMatchesCount: 0,
        partialMatchesCount: 0,
        missingSkillsCount: 0,
        experienceGapsCount: 0,
        educationGapsCount: 0,
        skillCoverageRatio: 0,
        baseSkillScore: 0,
        gapDeductions: 0,
      },
    };
  }

  const strongMatchesCount = analysis.strongMatches?.length ?? 0;
  const partialMatchesCount = analysis.partialMatches?.length ?? 0;
  const missingSkillsCount = analysis.missingSkills?.length ?? 0;
  const experienceGapsCount = analysis.experienceGaps?.length ?? 0;
  const educationGapsCount = analysis.educationGaps?.length ?? 0;

  const totalEvaluatedSkills = strongMatchesCount + partialMatchesCount + missingSkillsCount;

  let baseSkillScore = 0;
  let skillCoverageRatio = 0;

  if (totalEvaluatedSkills > 0) {
    const effectiveMatches = strongMatchesCount * 1.0 + partialMatchesCount * 0.5;
    skillCoverageRatio = Number((effectiveMatches / totalEvaluatedSkills).toFixed(2));
    baseSkillScore = Math.round((effectiveMatches / totalEvaluatedSkills) * 100);
  } else if (strongMatchesCount > 0) {
    baseSkillScore = 100;
    skillCoverageRatio = 1;
  }

  const gapDeductions = Math.min(35, experienceGapsCount * 8 + educationGapsCount * 5);

  const finalScore = Math.max(0, Math.min(100, Math.round(baseSkillScore - gapDeductions)));

  let label: MatchAlignmentTier;
  if (finalScore >= 85) {
    label = 'Exceptional';
  } else if (finalScore >= 70) {
    label = 'Strong';
  } else if (finalScore >= 50) {
    label = 'Moderate';
  } else {
    label = 'Low Alignment';
  }

  return {
    score: finalScore,
    label,
    breakdown: {
      strongMatchesCount,
      partialMatchesCount,
      missingSkillsCount,
      experienceGapsCount,
      educationGapsCount,
      skillCoverageRatio,
      baseSkillScore,
      gapDeductions,
    },
  };
}
