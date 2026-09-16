import { describe, expect, it } from 'vitest';
import { CreateJobDescriptionDtoSchema, StructuredJdSchema } from '../src/job-description.js';

describe('Job Description Schemas', () => {
  describe('StructuredJdSchema', () => {
    it('validates a complete structured JD with all fields', () => {
      const fullJd = {
        jobTitle: 'Senior Full Stack Engineer',
        seniority: 'Senior',
        requiredSkills: ['TypeScript', 'Next.js', 'PostgreSQL'],
        preferredSkills: ['Docker', 'AWS'],
        yearsOfExperience: '4+ years',
        responsibilities: [
          'Design and maintain production-grade web systems',
          'Optimize database queries and API response times',
        ],
        educationRequirements: ['B.Sc. in Computer Science or equivalent experience'],
        locationOrWorkMode: 'Remote',
        salary: '$100k - $130k',
        mustHave: ['Strong proficiency in TypeScript', 'Experience with PostgreSQL'],
        niceToHave: ['Experience with Prisma ORM'],
        otherNotes: ['Fast-paced startup environment'],
      };

      const parsed = StructuredJdSchema.parse(fullJd);
      expect(parsed.jobTitle).toBe('Senior Full Stack Engineer');
      expect(parsed.requiredSkills).toHaveLength(3);
      expect(parsed.mustHave).toHaveLength(2);
    });

    it('validates a minimal structured JD with defaults', () => {
      const minimalJd = {
        jobTitle: 'Software Engineer',
      };

      const parsed = StructuredJdSchema.parse(minimalJd);
      expect(parsed.jobTitle).toBe('Software Engineer');
      expect(parsed.requiredSkills).toEqual([]);
      expect(parsed.preferredSkills).toEqual([]);
      expect(parsed.responsibilities).toEqual([]);
      expect(parsed.mustHave).toEqual([]);
      expect(parsed.niceToHave).toEqual([]);
      expect(parsed.seniority).toBeUndefined();
    });

    it('rejects JD missing jobTitle or invalid skill array types', () => {
      expect(() => StructuredJdSchema.parse({})).toThrow();
      expect(() =>
        StructuredJdSchema.parse({
          jobTitle: 'Engineer',
          requiredSkills: 'TypeScript, Next.js', // should be an array
        }),
      ).toThrow();
    });
  });

  describe('CreateJobDescriptionDtoSchema', () => {
    it('validates valid rawText input', () => {
      const valid = {
        rawText:
          'We are looking for a skilled full-stack developer with React and Node experience.',
      };
      const parsed = CreateJobDescriptionDtoSchema.parse(valid);
      expect(parsed.rawText).toBe(valid.rawText);
    });

    it('rejects rawText shorter than 10 characters', () => {
      expect(() => CreateJobDescriptionDtoSchema.parse({ rawText: 'Short' })).toThrow();
      expect(() => CreateJobDescriptionDtoSchema.parse({})).toThrow();
    });
  });
});
