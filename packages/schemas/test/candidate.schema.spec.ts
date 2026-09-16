import { describe, expect, it } from 'vitest';
import {
  CandidateProfileSchema,
  CertificationSchema,
  CreateSkillDtoSchema,
  EducationSchema,
  ExperienceSchema,
  ProjectSchema,
  SkillLevelEnum,
  SkillSchema,
} from '../src/candidate.js';

describe('Candidate Schemas', () => {
  describe('SkillLevelEnum', () => {
    it('accepts valid skill levels', () => {
      expect(SkillLevelEnum.parse('EXPERIENCED')).toBe('EXPERIENCED');
      expect(SkillLevelEnum.parse('WORKING_KNOWLEDGE')).toBe('WORKING_KNOWLEDGE');
      expect(SkillLevelEnum.parse('LEARNING')).toBe('LEARNING');
      expect(SkillLevelEnum.parse('NOT_LEARNED')).toBe('NOT_LEARNED');
    });

    it('rejects invalid skill levels', () => {
      expect(() => SkillLevelEnum.parse('EXPERT')).toThrow();
      expect(() => SkillLevelEnum.parse('BEGINNER')).toThrow();
      expect(() => SkillLevelEnum.parse('')).toThrow();
    });
  });

  describe('SkillSchema & DTOs', () => {
    it('validates a complete skill', () => {
      const validSkill = {
        id: 'skill-1',
        name: 'TypeScript',
        level: 'EXPERIENCED',
        evidence: '5 years production experience building scalable apps',
      };
      const parsed = SkillSchema.parse(validSkill);
      expect(parsed.name).toBe('TypeScript');
      expect(parsed.level).toBe('EXPERIENCED');
    });

    it('rejects skill with missing name or level', () => {
      expect(() => SkillSchema.parse({ id: 'skill-1', name: '' })).toThrow();
      expect(() => SkillSchema.parse({ id: 'skill-1', level: 'EXPERIENCED' })).toThrow();
    });

    it('validates CreateSkillDtoSchema without id', () => {
      const dto = {
        name: 'PostgreSQL',
        level: 'WORKING_KNOWLEDGE',
      };
      const parsed = CreateSkillDtoSchema.parse(dto);
      expect(parsed.name).toBe('PostgreSQL');
      expect((parsed as any).id).toBeUndefined();
    });
  });

  describe('ExperienceSchema', () => {
    it('validates a valid experience record with defaults', () => {
      const valid = {
        id: 'exp-1',
        company: 'Softvence',
        title: 'Full Stack Developer',
      };
      const parsed = ExperienceSchema.parse(valid);
      expect(parsed.company).toBe('Softvence');
      expect(parsed.responsibilities).toEqual([]);
      expect(parsed.technologies).toEqual([]);
      expect(parsed.achievements).toEqual([]);
      expect(parsed.isCurrent).toBe(false);
    });

    it('rejects experience missing company or title', () => {
      expect(() => ExperienceSchema.parse({ id: 'exp-1', company: '' })).toThrow();
      expect(() => ExperienceSchema.parse({ id: 'exp-1', title: 'Developer' })).toThrow();
    });
  });

  describe('ProjectSchema', () => {
    it('validates a valid project record', () => {
      const valid = {
        id: 'proj-1',
        name: 'Praman',
        description: 'AI resume verification platform',
        technologies: ['TypeScript', 'NestJS', 'Next.js'],
        outcomes: ['Eliminated hallucinations with deterministic evidence checks'],
      };
      const parsed = ProjectSchema.parse(valid);
      expect(parsed.name).toBe('Praman');
      expect(parsed.technologies).toHaveLength(3);
    });

    it('rejects project missing description or name', () => {
      expect(() => ProjectSchema.parse({ id: 'proj-1', name: 'App' })).toThrow();
      expect(() => ProjectSchema.parse({ id: 'proj-1', description: 'Desc' })).toThrow();
    });
  });

  describe('EducationSchema & CertificationSchema', () => {
    it('validates education and certification', () => {
      const edu = EducationSchema.parse({
        id: 'edu-1',
        institution: 'Green University',
        degree: 'B.Sc. in CSE',
      });
      expect(edu.institution).toBe('Green University');

      const cert = CertificationSchema.parse({
        id: 'cert-1',
        name: 'Next Level Web Development',
        issuer: 'Programming Hero',
      });
      expect(cert.name).toBe('Next Level Web Development');
    });

    it('rejects invalid education and certification', () => {
      expect(() => EducationSchema.parse({ id: 'edu-1' })).toThrow();
      expect(() => CertificationSchema.parse({ id: 'cert-1', name: '' })).toThrow();
    });
  });

  describe('CandidateProfileSchema', () => {
    it('validates a full profile with defaults', () => {
      const profile = {
        personal: {
          name: 'Shahid Hasan Shuvo',
          location: 'Dhaka, Bangladesh',
          contact: { email: 'mrshanshuvo@gmail.com' },
          links: { github: 'https://github.com/shanshuvo' },
        },
        skills: [{ id: 's1', name: 'TypeScript', level: 'EXPERIENCED' }],
      };
      const parsed = CandidateProfileSchema.parse(profile);
      expect(parsed.personal.name).toBe('Shahid Hasan Shuvo');
      expect(parsed.skills).toHaveLength(1);
      expect(parsed.experiences).toEqual([]);
      expect(parsed.projects).toEqual([]);
      expect(parsed.educations).toEqual([]);
      expect(parsed.certifications).toEqual([]);
    });

    it('rejects profile missing personal information', () => {
      expect(() => CandidateProfileSchema.parse({})).toThrow();
      expect(() => CandidateProfileSchema.parse({ personal: { name: '' } })).toThrow();
    });
  });
});
