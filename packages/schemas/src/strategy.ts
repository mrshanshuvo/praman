import { z } from 'zod';

export const ResumeStrategySchema = z.object({
  emphasizedExperienceIds: z
    .array(z.string())
    .default([])
    .describe('Experience IDs to foreground in the resume'),
  emphasizedProjectIds: z
    .array(z.string())
    .default([])
    .describe('Project IDs to highlight prominently'),
  prioritizedSkills: z
    .array(z.string())
    .default([])
    .describe('Verified candidate skills to feature first'),
  gaps: z
    .array(z.string())
    .default([])
    .describe('Identified qualification or domain gaps to navigate honestly'),
  forbiddenClaims: z
    .array(z.string())
    .default([])
    .describe('Topics, metrics, or technologies explicitly forbidden to state or exaggerate'),
  narrativeGuidance: z
    .string()
    .describe('Free-text strategic guidance for tone, perspective, and role framing'),
});
export type ResumeStrategy = z.infer<typeof ResumeStrategySchema>;
