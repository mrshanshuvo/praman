import { beforeEach, describe, expect, it } from 'vitest';
import { ValidationService } from '../src/validation/validation.service.js';

describe('ValidationService (Anti-Hallucination & Truth Enforcement)', () => {
  let service: ValidationService;

  const candidateProfileFixture = {
    personal: {
      name: 'Shahid Hasan Shovu',
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
      {
        id: 'exp-2',
        company: 'Zensoft Lab',
        title: 'Frontend Developer Intern',
        responsibilities: ['Built UI components using React.js.'],
        achievements: [],
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
    service = new ValidationService();
  });

  it('VALIDATES a resume when all source IDs and skills match confirmed records', () => {
    const validResume = {
      personal: {
        name: 'Shahid Hasan Shovu',
        contact: { email: 'mrshanshuvo@gmail.com' },
      },
      summary: 'Experienced Full Stack Developer specializing in Next.js and TypeScript.',
      experience: [
        {
          sourceExperienceId: 'exp-1',
          company: 'Softvence Agency',
          title: 'Jr. Full Stack Developer',
          bullets: ['Developing production applications using Next.js, TypeScript, and NestJS.'],
        },
      ],
      projects: [
        {
          sourceProjectId: 'proj-1',
          name: 'CareCamp',
          bullets: ['Processed 250,000 transactions securely.'],
        },
      ],
      skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Docker'],
      education: [{ sourceEducationId: 'edu-1' }],
      certifications: [{ sourceCertificationId: 'cert-1' }],
    };

    const report = service.validateResume(validResume, candidateProfileFixture);

    expect(report.schemaValid).toBe(true);
    expect(report.status).toBe('VALIDATED');
    expect(report.violations).toHaveLength(0);
    expect(report.sourceIdChecks.every((c) => c.exists)).toBe(true);
    expect(report.skillChecks.every((s) => s.isAllowed)).toBe(true);
  });

  it('REJECTS a resume when sourceExperienceId does not exist in profile', () => {
    const invalidResume = {
      personal: { name: 'Shahid Hasan Shovu', contact: {} },
      summary: 'Developer summary',
      experience: [
        {
          sourceExperienceId: 'fabricated-exp-999',
          company: 'Fake Tech Corp',
          title: 'Lead Architect',
          bullets: ['Invented distributed blockchain cluster.'],
        },
      ],
      projects: [],
      skills: ['TypeScript'],
      education: [],
      certifications: [],
    };

    const report = service.validateResume(invalidResume, candidateProfileFixture);

    expect(report.status).toBe('REJECTED');
    expect(report.violations.some((v) => v.includes('Untraceable experience'))).toBe(true);
    expect(report.sourceIdChecks.find((c) => c.sourceId === 'fabricated-exp-999')?.exists).toBe(
      false,
    );
  });

  it('REJECTS a resume when a skill not present in candidate profile is claimed', () => {
    const hallucinatedSkillResume = {
      personal: { name: 'Shahid Hasan Shovu', contact: {} },
      summary: 'Developer summary',
      experience: [],
      projects: [],
      skills: ['TypeScript', 'RubyOnRails'], // RubyOnRails is NOT in profile
      education: [],
      certifications: [],
    };

    const report = service.validateResume(hallucinatedSkillResume, candidateProfileFixture);

    expect(report.status).toBe('REJECTED');
    expect(
      report.violations.some((v) => v.includes('Skill hallucination') && v.includes('RubyOnRails')),
    ).toBe(true);
  });

  it('REJECTS a resume when a NOT_LEARNED skill is claimed', () => {
    const forbiddenSkillResume = {
      personal: { name: 'Shahid Hasan Shovu', contact: {} },
      summary: 'Developer summary',
      experience: [],
      projects: [],
      skills: ['TypeScript', 'Solidity'], // Solidity is marked NOT_LEARNED
      education: [],
      certifications: [],
    };

    const report = service.validateResume(forbiddenSkillResume, candidateProfileFixture);

    expect(report.status).toBe('REJECTED');
    expect(
      report.violations.some((v) => v.includes('Forbidden skill claim') && v.includes('Solidity')),
    ).toBe(true);
  });

  it('REJECTS a resume when a LEARNING-level skill is claimed in the verified skills list', () => {
    const learningSkillResume = {
      personal: { name: 'Shahid Hasan Shovu', contact: {} },
      summary: 'Developer summary',
      experience: [],
      projects: [],
      skills: ['TypeScript', 'System Design'], // System Design is LEARNING
      education: [],
      certifications: [],
    };

    const report = service.validateResume(learningSkillResume, candidateProfileFixture);

    expect(report.status).toBe('REJECTED');
    expect(
      report.violations.some(
        (v) => v.includes('Premature skill claim') && v.includes('System Design'),
      ),
    ).toBe(true);
  });

  it('FLAGS numbers in resume bullets that were not present in source records', () => {
    const inflatedNumberResume = {
      personal: { name: 'Shahid Hasan Shovu', contact: {} },
      summary: 'Developer summary',
      experience: [
        {
          sourceExperienceId: 'exp-1',
          company: 'Softvence Agency',
          title: 'Jr. Full Stack Developer',
          bullets: ['Reduced API latency by 99% with quantum caching.'], // Source says 40%, not 99%
        },
      ],
      projects: [],
      skills: ['TypeScript'],
      education: [],
      certifications: [],
    };

    const report = service.validateResume(inflatedNumberResume, candidateProfileFixture);

    expect(report.numberFlags).toHaveLength(1);
    expect(report.numberFlags[0].flaggedNumbers).toContain('99%');
  });
});
