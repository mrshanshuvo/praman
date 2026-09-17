import { type ResumeStrategy, ResumeStrategySchema } from '@praman/schemas';
import { beforeEach, describe, expect, it } from 'vitest';
import { AiService } from '../../src/modules/ai/ai.service.js';
import { RESUME_STRATEGY_SYSTEM_PROMPT_V1 } from '../../src/modules/ai/prompts/resume-strategy.v1.js';

describe('Golden Test: Resume Strategy Stage 3', () => {
  let aiService: AiService;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    aiService = new AiService();
  });

  const fixtures = [
    {
      name: 'standard-match',
      matchAnalysis: {
        strongMatches: ['TypeScript', 'Next.js', 'PostgreSQL'],
        partialMatches: ['REST APIs'],
        missingSkills: [],
        experienceGaps: [],
        educationGaps: [],
        relevantExperience: ['exp-1'],
        relevantProjects: ['proj-1'],
        emphasize: ['Full stack delivery'],
        doNotClaim: [],
        explanation: 'Strong fit across all core domains.',
      },
      structuredJd: {
        jobTitle: 'Senior Full Stack Engineer',
      },
    },
    {
      name: 'gap-heavy-match',
      matchAnalysis: {
        strongMatches: ['TypeScript'],
        partialMatches: [],
        missingSkills: ['Kubernetes', 'Solidity', 'Go'],
        experienceGaps: ['Enterprise scale'],
        educationGaps: [],
        relevantExperience: ['exp-1'],
        relevantProjects: [],
        emphasize: ['TypeScript fundamentals'],
        doNotClaim: ['Kubernetes', 'Solidity'],
        explanation: 'Several critical domain gaps to navigate.',
      },
      structuredJd: {
        jobTitle: 'DevOps & Blockchain Architect',
      },
    },
    {
      name: 'empty-match',
      matchAnalysis: {
        strongMatches: [],
        partialMatches: [],
        missingSkills: ['Java', 'Spring Boot'],
        experienceGaps: ['Java ecosystem'],
        educationGaps: [],
        relevantExperience: [],
        relevantProjects: [],
        emphasize: [],
        doNotClaim: ['Java', 'Spring Boot'],
        explanation: 'Minimal overlap.',
      },
      structuredJd: {
        jobTitle: 'Java Backend Specialist',
      },
    },
  ];

  for (const fixture of fixtures) {
    it(`generates valid resume strategy for "${fixture.name}"`, async () => {
      const result = await aiService.runStructuredCall<ResumeStrategy>({
        systemPrompt: RESUME_STRATEGY_SYSTEM_PROMPT_V1,
        userPrompt: JSON.stringify({
          matchAnalysis: fixture.matchAnalysis,
          structuredJd: fixture.structuredJd,
        }),
        outputSchema: ResumeStrategySchema,
        schemaName: 'ResumeStrategy',
      });

      // 1. Zod schema validation
      const parse = ResumeStrategySchema.safeParse(result);
      expect(parse.success).toBe(true);

      // 2. Structural invariants
      expect(Array.isArray(result.emphasizedExperienceIds)).toBe(true);
      expect(Array.isArray(result.emphasizedProjectIds)).toBe(true);
      expect(Array.isArray(result.prioritizedSkills)).toBe(true);
      expect(Array.isArray(result.gaps)).toBe(true);
      expect(Array.isArray(result.forbiddenClaims)).toBe(true);
      expect(typeof result.narrativeGuidance).toBe('string');
      expect(result.narrativeGuidance.length).toBeGreaterThan(10);

      // 3. Emphasized IDs should match recommended relevant items
      if (fixture.matchAnalysis.relevantExperience.length > 0) {
        expect(result.emphasizedExperienceIds).toEqual(fixture.matchAnalysis.relevantExperience);
      }
    });
  }
});
