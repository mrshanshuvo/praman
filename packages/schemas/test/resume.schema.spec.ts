import { describe, expect, it } from 'vitest';
import { ResumeSchema, ResumeStatusEnum, ValidationReportSchema } from '../src/resume.js';

describe('Resume and Validation Schemas', () => {
  describe('ResumeStatusEnum', () => {
    it('accepts valid statuses', () => {
      expect(ResumeStatusEnum.parse('DRAFT')).toBe('DRAFT');
      expect(ResumeStatusEnum.parse('VALIDATED')).toBe('VALIDATED');
      expect(ResumeStatusEnum.parse('REJECTED')).toBe('REJECTED');
    });

    it('rejects unknown status', () => {
      expect(() => ResumeStatusEnum.parse('PENDING')).toThrow();
      expect(() => ResumeStatusEnum.parse('APPROVED')).toThrow();
    });
  });

  describe('ResumeSchema', () => {
    it('validates a complete resume with all sections', () => {
      const fullResume = {
        personal: {
          name: 'Shahid Hasan Shuvo',
          contact: { email: 'mrshanshuvo@gmail.com', phone: '+8801700000000' },
        },
        summary:
          'Passionate Full Stack Web Developer with extensive experience in React, Next.js, and NestJS.',
        experience: [
          {
            sourceExperienceId: 'exp-1',
            company: 'Softvence Agency',
            title: 'Jr. Full Stack Developer',
            bullets: [
              'Architected REST APIs with NestJS.',
              'Reduced database query time by 40% with PostgreSQL indexing.',
            ],
          },
        ],
        projects: [
          {
            sourceProjectId: 'proj-1',
            name: 'CareCamp',
            bullets: ['Developed full stack features using Next.js and Prisma.'],
          },
        ],
        skills: ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL'],
        education: [
          {
            sourceEducationId: 'edu-1',
            institution: 'Green University of Bangladesh',
            degree: 'B.Sc. in Computer Science',
          },
        ],
        certifications: [
          {
            sourceCertificationId: 'cert-1',
            name: 'Next Level Web Development',
          },
        ],
      };

      const parsed = ResumeSchema.parse(fullResume);
      expect(parsed.personal.name).toBe('Shahid Hasan Shuvo');
      expect(parsed.experience).toHaveLength(1);
      expect(parsed.experience[0].sourceExperienceId).toBe('exp-1');
      expect(parsed.projects).toHaveLength(1);
      expect(parsed.projects[0].sourceProjectId).toBe('proj-1');
      expect(parsed.education[0].sourceEducationId).toBe('edu-1');
      expect(parsed.certifications?.[0].sourceCertificationId).toBe('cert-1');
    });

    it('rejects resume with missing summary or missing sourceExperienceId', () => {
      expect(() =>
        ResumeSchema.parse({
          personal: { name: 'Shahid', contact: {} },
          summary: '', // min 1 char
        }),
      ).toThrow();

      expect(() =>
        ResumeSchema.parse({
          personal: { name: 'Shahid', contact: {} },
          summary: 'A valid summary',
          experience: [
            {
              // missing sourceExperienceId
              company: 'Company',
              title: 'Dev',
              bullets: ['Bullet 1'],
            },
          ],
        }),
      ).toThrow();

      expect(() =>
        ResumeSchema.parse({
          personal: { name: 'Shahid', contact: {} },
          summary: 'A valid summary',
          projects: [
            {
              // missing bullets
              sourceProjectId: 'proj-1',
              name: 'Project',
              bullets: [],
            },
          ],
        }),
      ).toThrow();
    });
  });

  describe('ValidationReportSchema', () => {
    it('validates a VALIDATED report with pass records', () => {
      const validReport = {
        schemaValid: true,
        status: 'VALIDATED',
        violations: [],
        sourceIdChecks: [
          {
            field: 'experience',
            sourceId: 'exp-1',
            exists: true,
            details: 'Mapped to Softvence',
          },
        ],
        skillChecks: [
          {
            skill: 'TypeScript',
            existsInProfile: true,
            candidateLevel: 'EXPERIENCED',
            isAllowed: true,
          },
        ],
        numberFlags: [],
        checkedAt: new Date().toISOString(),
      };

      const parsed = ValidationReportSchema.parse(validReport);
      expect(parsed.status).toBe('VALIDATED');
      expect(parsed.schemaValid).toBe(true);
      expect(parsed.violations).toHaveLength(0);
    });

    it('validates a REJECTED report with violations and flags', () => {
      const rejectedReport = {
        schemaValid: true,
        status: 'REJECTED',
        violations: ['Skill hallucination: Solidity is marked as NOT_LEARNED'],
        sourceIdChecks: [
          {
            field: 'experience',
            sourceId: 'exp-fake-999',
            exists: false,
          },
        ],
        skillChecks: [
          {
            skill: 'Solidity',
            existsInProfile: true,
            candidateLevel: 'NOT_LEARNED',
            isAllowed: false,
            violation: 'Marked as NOT_LEARNED',
          },
        ],
        numberFlags: [
          {
            location: 'Experience (Softvence)',
            bullet: 'Increased speed by 99%',
            flaggedNumbers: ['99%'],
            reason: 'Number not in source',
          },
        ],
      };

      const parsed = ValidationReportSchema.parse(rejectedReport);
      expect(parsed.status).toBe('REJECTED');
      expect(parsed.violations).toHaveLength(1);
      expect(parsed.numberFlags).toHaveLength(1);
    });

    it('rejects report with invalid status', () => {
      expect(() =>
        ValidationReportSchema.parse({
          schemaValid: true,
          status: 'INVALID_STATUS',
        }),
      ).toThrow();
    });
  });
});
