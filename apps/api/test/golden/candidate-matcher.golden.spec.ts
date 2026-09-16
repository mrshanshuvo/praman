import { type MatchAnalysis, MatchAnalysisSchema } from '@praman/schemas';
import { beforeEach, describe, expect, it } from 'vitest';
import { AiService } from '../../src/ai/ai.service.js';
import { CANDIDATE_MATCHER_SYSTEM_PROMPT_V1 } from '../../src/prompts/candidate-matcher.v1.js';

describe('Golden Test: Candidate Matcher Stage 2', () => {
  let aiService: AiService;

  const candidateProfileFixture = {
    personal: {
      name: 'Shahid Hasan Shuvo',
      contact: { email: 'mrshanshuvo@gmail.com' },
    },
    experiences: [
      {
        id: 'exp-1',
        company: 'Softvence Agency',
        title: 'Jr. Full Stack Developer',
        responsibilities: [
          'Developing production applications using Next.js, TypeScript, and NestJS.',
        ],
        achievements: ['Reduced API latency by 40% with PostgreSQL indexing.'],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'CareCamp',
        description: 'Medical management platform with RESTful APIs.',
        outcomes: ['Processed 250,000 transactions securely.'],
      },
    ],
    skills: [
      { name: 'TypeScript', level: 'EXPERIENCED' },
      { name: 'Next.js', level: 'EXPERIENCED' },
      { name: 'PostgreSQL', level: 'EXPERIENCED' },
      { name: 'Docker', level: 'WORKING_KNOWLEDGE' },
      { name: 'System Design', level: 'LEARNING' },
      { name: 'Kubernetes', level: 'NOT_LEARNED' },
      { name: 'Solidity', level: 'NOT_LEARNED' },
    ],
    educations: [
      {
        id: 'edu-1',
        institution: 'Green University of Bangladesh',
        degree: 'B.Sc.',
      },
    ],
    certifications: [{ id: 'cert-1', name: 'Next Level Web Development' }],
  };

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    aiService = new AiService();
  });

  const fixtures = [
    {
      name: 'full-match',
      structuredJd: {
        jobTitle: 'Full Stack Engineer',
        requiredSkills: ['TypeScript', 'Next.js', 'PostgreSQL'],
        preferredSkills: ['Docker'],
        responsibilities: ['Build full stack web applications'],
        mustHave: ['TypeScript', 'Next.js'],
        niceToHave: ['Docker'],
      },
      expectedStrong: ['TypeScript', 'Next.js', 'PostgreSQL'],
    },
    {
      name: 'gap-heavy',
      structuredJd: {
        jobTitle: 'Cloud Native / Blockchain Engineer',
        requiredSkills: ['Kubernetes', 'Solidity', 'Go', 'System Design'],
        preferredSkills: [],
        responsibilities: ['Manage cloud clusters and smart contracts'],
        mustHave: ['Kubernetes', 'Solidity'],
        niceToHave: [],
      },
      expectedDoNotClaimOrMissing: ['Kubernetes', 'Solidity', 'Go', 'System Design'],
    },
    {
      name: 'mixed-skills-jd',
      structuredJd: {
        jobTitle: 'Web Developer',
        requiredSkills: ['TypeScript', 'Kubernetes'],
        preferredSkills: ['PostgreSQL'],
        responsibilities: ['Maintain applications'],
        mustHave: ['TypeScript'],
        niceToHave: [],
      },
      expectedStrong: ['TypeScript'],
      expectedDoNotClaimOrMissing: ['Kubernetes'],
    },
  ];

  for (const fixture of fixtures) {
    it(`correctly matches candidate for "${fixture.name}"`, async () => {
      const result = await aiService.runStructuredCall<MatchAnalysis>({
        systemPrompt: CANDIDATE_MATCHER_SYSTEM_PROMPT_V1,
        userPrompt: JSON.stringify({
          candidateProfile: candidateProfileFixture,
          structuredJd: fixture.structuredJd,
        }),
        outputSchema: MatchAnalysisSchema,
        schemaName: 'MatchAnalysis',
      });

      // 1. Zod schema validation
      const parse = MatchAnalysisSchema.safeParse(result);
      expect(parse.success).toBe(true);

      // 2. Structural invariants
      expect(typeof result.explanation).toBe('string');
      expect(result.explanation.length).toBeGreaterThan(10);
      expect(Array.isArray(result.strongMatches)).toBe(true);
      expect(Array.isArray(result.missingSkills)).toBe(true);
      expect(Array.isArray(result.doNotClaim)).toBe(true);
      expect(Array.isArray(result.relevantExperience)).toBe(true);
      expect(Array.isArray(result.relevantProjects)).toBe(true);

      // 3. Relevant experiences and projects MUST exist in candidate profile
      const validExpIds = candidateProfileFixture.experiences.map((e) => e.id);
      const validProjIds = candidateProfileFixture.projects.map((p) => p.id);
      for (const expId of result.relevantExperience) {
        expect(validExpIds).toContain(expId);
      }
      for (const projId of result.relevantProjects) {
        expect(validProjIds).toContain(projId);
      }

      // 4. Anti-hallucination verification
      if (fixture.expectedStrong) {
        for (const skill of fixture.expectedStrong) {
          expect(result.strongMatches).toContain(skill);
        }
      }

      if (fixture.expectedDoNotClaimOrMissing) {
        for (const skill of fixture.expectedDoNotClaimOrMissing) {
          const isMissing = result.missingSkills.includes(skill);
          const isDoNotClaim = result.doNotClaim.some((c) => c.includes(skill));
          expect(isMissing || isDoNotClaim).toBe(true);
        }
      }
    });
  }
});
