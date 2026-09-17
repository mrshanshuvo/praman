import { type StructuredJd, StructuredJdSchema } from '@praman/schemas';
import { beforeEach, describe, expect, it } from 'vitest';
import { AiService } from '../../src/modules/ai/ai.service.js';
import { JD_ANALYZER_SYSTEM_PROMPT_V1 } from '../../src/modules/ai/prompts/jd-analyzer.v1.js';

describe('Golden Test: JD Analyzer Stage 1', () => {
  let aiService: AiService;

  beforeEach(() => {
    // Ensure deterministic offline fallback engine runs
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    aiService = new AiService();
  });

  const fixtures = [
    {
      name: 'senior-nextjs',
      rawText: `
Senior Full Stack Engineer (Next.js / TypeScript)
Location: Remote
Experience: 3+ years
We are looking for a Senior Full Stack Engineer proficient in Next.js, React.js, TypeScript, and Node.js.
Must have deep experience with PostgreSQL, Prisma ORM, and building high-traffic REST APIs.
Bonus: Docker, AWS, Redis, GraphQL.
Competitive salary and flexible hours.
      `.trim(),
      expectedSkills: ['Next.js', 'React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma'],
      expectedSeniority: 'Senior',
    },
    {
      name: 'backend-nestjs',
      rawText: `
Backend Engineer (NestJS / PostgreSQL)
Location: Hybrid
Experience: 2+ years
Looking for a developer to architect microservices using NestJS, TypeScript, Node.js, and PostgreSQL.
Required: Docker, REST APIs. Nice to have: Kubernetes, Kafka.
      `.trim(),
      expectedSkills: ['NestJS', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs'],
      expectedSeniority: 'Mid-Level',
    },
    {
      name: 'minimal-jd',
      rawText: `
Looking for a React developer with JavaScript experience.
      `.trim(),
      expectedSkills: ['React', 'JavaScript'],
      expectedSeniority: 'Mid-Level',
    },
  ];

  for (const fixture of fixtures) {
    it(`correctly extracts structured JD for "${fixture.name}"`, async () => {
      const result = await aiService.runStructuredCall<StructuredJd>({
        systemPrompt: JD_ANALYZER_SYSTEM_PROMPT_V1,
        userPrompt: JSON.stringify({ rawText: fixture.rawText }),
        outputSchema: StructuredJdSchema,
        schemaName: 'StructuredJd',
      });

      // 1. Zod schema validation
      const parse = StructuredJdSchema.safeParse(result);
      expect(parse.success).toBe(true);

      // 2. Structural invariants
      expect(typeof result.jobTitle).toBe('string');
      expect(result.jobTitle.length).toBeGreaterThan(0);
      expect(Array.isArray(result.requiredSkills)).toBe(true);
      expect(Array.isArray(result.preferredSkills)).toBe(true);
      expect(Array.isArray(result.responsibilities)).toBe(true);
      expect(Array.isArray(result.mustHave)).toBe(true);
      expect(Array.isArray(result.niceToHave)).toBe(true);

      // 3. Expected extracted skills
      for (const expectedSkill of fixture.expectedSkills) {
        const found =
          result.requiredSkills.includes(expectedSkill) ||
          result.preferredSkills.includes(expectedSkill) ||
          result.mustHave.includes(expectedSkill) ||
          result.niceToHave.includes(expectedSkill);
        expect(found).toBe(true);
      }
    });
  }
});
