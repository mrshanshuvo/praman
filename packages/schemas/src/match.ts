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
