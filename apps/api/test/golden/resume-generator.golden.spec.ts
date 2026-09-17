import { type ResumeData, ResumeSchema } from '@praman/schemas';
import { beforeEach, describe, expect, it } from 'vitest';
import { AiService } from '../../src/modules/ai/ai.service.js';
import { RESUME_GENERATOR_SYSTEM_PROMPT_V1 } from '../../src/modules/ai/prompts/resume-generator.v1.js';
import { ValidationService } from '../../src/modules/validation/validation.service.js';

describe('Golden Test: Resume Generator Stage 4 & Truth Preservation', () => {
  let aiService: AiService;
  let validationService: ValidationService;

  const candidateProfileFixture = {
    personal: {
      name: 'Shahid Hasan Shuvo',
      summary:
        'Full-Stack Developer specializing in Next.js, TypeScript, Node.js, and NestJS, with proven experience delivering production-ready web applications.',
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
      { name: 'Solidity', level: 'NOT_LEARNED' },
      { name: 'Kubernetes', level: 'NOT_LEARNED' },
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
    validationService = new ValidationService();
  });

  const fixtures = [
    {
      name: 'standard-fullstack-run',
      structuredJd: {
        jobTitle: 'Senior Full Stack Engineer',
        requiredSkills: ['Next.js', 'TypeScript', 'PostgreSQL'],
      },
      matchAnalysis: {
        strongMatches: ['Next.js', 'TypeScript', 'PostgreSQL'],
        partialMatches: ['Docker'],
        missingSkills: [],
        relevantExperience: ['exp-1'],
        relevantProjects: ['proj-1'],
        emphasize: ['Full stack delivery'],
        doNotClaim: ['Kubernetes', 'Solidity', 'System Design'],
        explanation: 'Verified strong match.',
      },
      resumeStrategy: {
        emphasizedExperienceIds: ['exp-1'],
        emphasizedProjectIds: ['proj-1'],
        prioritizedSkills: ['TypeScript', 'Next.js', 'PostgreSQL'],
        gaps: [],
        forbiddenClaims: ['Kubernetes', 'Solidity'],
        narrativeGuidance: 'Highlight full stack proficiency with verifiable records.',
      },
    },
    {
      name: 'strict-domain-run',
      structuredJd: {
        jobTitle: 'Backend Developer',
        requiredSkills: ['TypeScript', 'PostgreSQL'],
      },
      matchAnalysis: {
        strongMatches: ['TypeScript', 'PostgreSQL'],
        partialMatches: [],
        missingSkills: ['Kubernetes'],
        relevantExperience: ['exp-1'],
        relevantProjects: [],
        emphasize: ['Backend efficiency'],
        doNotClaim: ['Kubernetes'],
        explanation: 'Backend alignment verified.',
      },
      resumeStrategy: {
        emphasizedExperienceIds: ['exp-1'],
        emphasizedProjectIds: [],
        prioritizedSkills: ['TypeScript', 'PostgreSQL'],
        gaps: ['Kubernetes'],
        forbiddenClaims: ['Kubernetes'],
        narrativeGuidance: 'Focus strictly on database optimization and backend APIs.',
      },
    },
  ];

  for (const fixture of fixtures) {
    it(`generates a verified, truth-preserving resume for "${fixture.name}"`, async () => {
      const result = await aiService.runStructuredCall<ResumeData>({
        systemPrompt: RESUME_GENERATOR_SYSTEM_PROMPT_V1,
        userPrompt: JSON.stringify({
          candidateProfile: candidateProfileFixture,
          structuredJd: fixture.structuredJd,
          matchAnalysis: fixture.matchAnalysis,
          resumeStrategy: fixture.resumeStrategy,
        }),
        outputSchema: ResumeSchema,
        schemaName: 'Resume',
      });

      // 1. Zod schema validation
      const parse = ResumeSchema.safeParse(result);
      expect(parse.success).toBe(true);

      // 2. Personal info & summary
      expect(result.personal.name).toBe('Shahid Hasan Shuvo');
      expect(result.summary.length).toBeGreaterThan(20);

      // 3. Absolute Traceability Checks: IDs must belong to candidateProfileFixture
      const validExpIds = candidateProfileFixture.experiences.map((e) => e.id);
      const validProjIds = candidateProfileFixture.projects.map((p) => p.id);
      const validEduIds = candidateProfileFixture.educations.map((e) => e.id);
      const validCertIds = candidateProfileFixture.certifications.map((c) => c.id);

      for (const exp of result.experience) {
        expect(validExpIds).toContain(exp.sourceExperienceId);
      }
      for (const proj of result.projects) {
        expect(validProjIds).toContain(proj.sourceProjectId);
      }
      for (const edu of result.education) {
        expect(validEduIds).toContain(edu.sourceEducationId);
      }
      for (const cert of result.certifications || []) {
        expect(validCertIds).toContain(cert.sourceCertificationId);
      }

      // 4. Skills Anti-Hallucination: No LEARNING or NOT_LEARNED skills
      expect(result.skills).not.toContain('Solidity');
      expect(result.skills).not.toContain('Kubernetes');
      expect(result.skills).not.toContain('System Design');

      // 5. Full Validation Service Audit
      const report = validationService.validateResume(result, candidateProfileFixture);
      expect(report.schemaValid).toBe(true);
      expect(report.status).toBe('VALIDATED');
      expect(report.violations).toHaveLength(0);
      expect(report.sourceIdChecks.every((c) => c.exists)).toBe(true);
      expect(report.skillChecks.every((s) => s.isAllowed)).toBe(true);

      // 6. Skills Curation: must not exceed 16, must only come from prioritizedSkills
      const allowedSkills = new Set(
        fixture.resumeStrategy.prioritizedSkills.map((s) => s.toLowerCase()),
      );
      expect(result.skills.length).toBeLessThanOrEqual(16);
      for (const skill of result.skills) {
        expect(allowedSkills.has(skill.toLowerCase())).toBe(true);
      }

      // 7. Bullet Quality: no bullets should start with passive phrases
      const passivePhrases = [
        'worked with',
        'helped',
        'assisted',
        'was responsible for',
        'participated in',
      ];
      for (const exp of result.experience) {
        for (const bullet of exp.bullets) {
          const lower = bullet.toLowerCase();
          for (const phrase of passivePhrases) {
            expect(lower.startsWith(phrase), `Passive bullet found: "${bullet}"`).toBe(false);
          }
        }
      }

      // 8. Summary Ground Truth (§0 P0 Fix): no untraceable numbers or unlearned skills in summary
      const summaryFlags = report.numberFlags.filter((f) => f.location === 'Summary');
      expect(summaryFlags).toHaveLength(0);
      expect(result.summary.toLowerCase()).not.toContain('solidity');
      expect(result.summary.toLowerCase()).not.toContain('kubernetes');
    });
  }
});
