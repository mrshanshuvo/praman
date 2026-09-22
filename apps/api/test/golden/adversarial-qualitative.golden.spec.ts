import { beforeEach, describe, expect, it } from 'vitest';
import { ValidationService } from '../../src/modules/validation/validation.service.js';

describe('Golden Test: Adversarial Qualitative & Seniority Integrity Guard', () => {
  let validationService: ValidationService;

  // Candidate with zero leadership, management, or architecture claims (pure junior individual contributor)
  const juniorCandidateFixture = {
    personal: {
      name: 'Samir Dev',
      summary:
        'Frontend Developer with practical experience in React, JavaScript, and responsive UI design.',
      contact: { email: 'samir@example.com' },
    },
    experiences: [
      {
        id: 'exp-junior-1',
        company: 'PixelCraft Studio',
        title: 'Junior Frontend Developer',
        responsibilities: [
          'Developed reusable UI components using React and TailwindCSS.',
          'Assisted with bug triage and frontend performance optimizations.',
        ],
        achievements: ['Implemented responsive navbar used across 3 marketing pages.'],
      },
    ],
    projects: [
      {
        id: 'proj-junior-1',
        name: 'TaskTrack',
        description: 'Personal task manager built with React and LocalStorage.',
        outcomes: ['Built clean Kanban interface with drag and drop.'],
      },
    ],
    skills: [
      { name: 'React', level: 'EXPERIENCED' },
      { name: 'JavaScript', level: 'EXPERIENCED' },
      { name: 'TailwindCSS', level: 'WORKING_KNOWLEDGE' },
      { name: 'TypeScript', level: 'LEARNING' },
      { name: 'System Design', level: 'NOT_LEARNED' },
    ],
    educations: [
      {
        id: 'edu-junior-1',
        institution: 'State University',
        degree: 'B.Sc. in Computer Science',
      },
    ],
    certifications: [],
  };

  beforeEach(() => {
    validationService = new ValidationService();
  });

  it('REJECTS resume summary when junior candidate claims team leadership or mentoring', () => {
    const overclaimingResume = {
      personal: {
        name: 'Samir Dev',
        contact: { email: 'samir@example.com' },
      },
      summary:
        'High-impact engineering lead who led a team of developers and mentored junior developers across sprint cycles.',
      experience: [
        {
          sourceExperienceId: 'exp-junior-1',
          company: 'PixelCraft Studio',
          title: 'Junior Frontend Developer',
          bullets: ['Developed reusable UI components using React and TailwindCSS.'],
        },
      ],
      projects: [
        {
          sourceProjectId: 'proj-junior-1',
          name: 'TaskTrack',
          bullets: ['Built clean Kanban interface with drag and drop.'],
        },
      ],
      skills: ['React', 'JavaScript'],
      education: [{ sourceEducationId: 'edu-junior-1' }],
    };

    const report = validationService.validateResume(overclaimingResume, juniorCandidateFixture);

    expect(report.status).toBe('REJECTED');
    expect(report.violations.length).toBeGreaterThan(0);
    const hasLeadershipViolation = report.violations.some(
      (v) => v.includes('Unsubstantiated qualitative claim') && v.includes('led a team'),
    );
    expect(hasLeadershipViolation).toBe(true);
  });

  it('REJECTS experience bullets when candidate invents supervisory or management roles', () => {
    const overclaimingBulletResume = {
      personal: {
        name: 'Samir Dev',
        contact: { email: 'samir@example.com' },
      },
      summary: 'Frontend developer passionate about building clean interfaces.',
      experience: [
        {
          sourceExperienceId: 'exp-junior-1',
          company: 'PixelCraft Studio',
          title: 'Junior Frontend Developer',
          bullets: ['Managed an engineering team to deliver feature milestones on time.'],
        },
      ],
      projects: [],
      skills: ['React', 'JavaScript'],
      education: [{ sourceEducationId: 'edu-junior-1' }],
    };

    const report = validationService.validateResume(
      overclaimingBulletResume,
      juniorCandidateFixture,
    );

    expect(report.status).toBe('REJECTED');
    const hasManagementViolation = report.violations.some(
      (v) =>
        v.includes('Unsubstantiated qualitative claim') &&
        v.toLowerCase().includes('managed an engineering team'),
    );
    expect(hasManagementViolation).toBe(true);
  });

  it('REJECTS cover letter when candidate claims leadership or management authority', () => {
    const overclaimingCoverLetter = `
      Dear Hiring Team,
      I am writing to express my strong interest in the Engineering Lead position.
      At PixelCraft Studio, I served as a technical lead and managed a team of engineers while driving architecture.
      I look forward to discussing how my experience will add value.
    `;

    const validation = validationService.validateFreeText(
      overclaimingCoverLetter,
      juniorCandidateFixture,
      'Cover Letter',
    );

    expect(validation.violations.length).toBeGreaterThan(0);
    const hasViolation = validation.violations.some((v) =>
      v.includes('Unsubstantiated qualitative claim in cover letter'),
    );
    expect(hasViolation).toBe(true);
  });

  it('VALIDATES honest resume adhering strictly to individual contributor scope', () => {
    const honestResume = {
      personal: {
        name: 'Samir Dev',
        contact: { email: 'samir@example.com' },
      },
      summary:
        'Frontend Developer experienced in building responsive React applications and maintainable UI components.',
      experience: [
        {
          sourceExperienceId: 'exp-junior-1',
          company: 'PixelCraft Studio',
          title: 'Junior Frontend Developer',
          bullets: [
            'Developed reusable UI components using React and TailwindCSS.',
            'Implemented responsive navbar used across 3 marketing pages.',
          ],
        },
      ],
      projects: [
        {
          sourceProjectId: 'proj-junior-1',
          name: 'TaskTrack',
          bullets: ['Built clean Kanban interface with drag and drop.'],
        },
      ],
      skills: ['React', 'JavaScript', 'TailwindCSS'],
      education: [{ sourceEducationId: 'edu-junior-1' }],
    };

    const report = validationService.validateResume(honestResume, juniorCandidateFixture);

    expect(report.status).toBe('VALIDATED');
    expect(report.violations).toHaveLength(0);
    expect(report.schemaValid).toBe(true);
  });

  it('ALLOWS leadership claims when candidate profile actually possesses verified leadership evidence', () => {
    const seniorCandidateFixture = {
      ...juniorCandidateFixture,
      experiences: [
        {
          id: 'exp-senior-1',
          company: 'ScaleWorks Inc.',
          title: 'Engineering Team Lead',
          responsibilities: [
            'Led a team of 6 engineers developing distributed microservices.',
            'Mentored junior developers in TypeScript and testing best practices.',
          ],
          achievements: [],
        },
      ],
    };

    const legitimateLeadResume = {
      personal: {
        name: 'Samir Dev',
        contact: { email: 'samir@example.com' },
      },
      summary: 'Engineering Team Lead with experience leading cross-functional teams.',
      experience: [
        {
          sourceExperienceId: 'exp-senior-1',
          company: 'ScaleWorks Inc.',
          title: 'Engineering Team Lead',
          bullets: [
            'Led a team of 6 engineers developing distributed microservices.',
            'Mentored junior developers in TypeScript and testing best practices.',
          ],
        },
      ],
      projects: [],
      skills: ['React', 'JavaScript'],
      education: [{ sourceEducationId: 'edu-junior-1' }],
    };

    const report = validationService.validateResume(legitimateLeadResume, seniorCandidateFixture);

    expect(report.status).toBe('VALIDATED');
    expect(report.violations).toHaveLength(0);
  });

  it('REJECTS ungrounded authority/expert claims (e.g. "expert problem solver", "subject matter expert") from junior candidates', () => {
    const ungroundedExpertResume = {
      personal: {
        name: 'Samir Dev',
        contact: { email: 'samir@example.com' },
      },
      summary:
        'Frontend Developer and recognized expert problem solver with subject matter expert capabilities.',
      experience: [],
      projects: [],
      skills: ['React', 'JavaScript'],
      education: [{ sourceEducationId: 'edu-junior-1' }],
    };

    const report = validationService.validateResume(ungroundedExpertResume, juniorCandidateFixture);

    expect(report.status).toBe('REJECTED');
    expect(
      report.violations.some(
        (v) =>
          v.includes('Unsubstantiated qualitative claim') &&
          (v.includes('expert problem solver') || v.includes('subject matter expert')),
      ),
    ).toBe(true);
  });

  it('DOES NOT flag harmless scheduling call durations (e.g. "10-15 minutes for a quick call") in outreach emails', () => {
    const outreachEmailWithScheduling = `
      Hi Team,

      I built responsive UI components in React and optimized bundle sizes.
      Achieved high quality across web pages.

      Do you have 10-15 minutes for a quick call this week to discuss the opportunity?
    `;

    const validation = validationService.validateFreeText(
      outreachEmailWithScheduling,
      juniorCandidateFixture,
      'Outreach Email',
    );

    expect(validation.violations).toHaveLength(0);
    // Should NOT flag 10 and 15 from "10-15 minutes for a quick call"
    const flagged10or15 = validation.numberFlags.some((f) =>
      f.flaggedNumbers.some((num) => num === '10' || num === '15'),
    );
    expect(flagged10or15).toBe(false);
  });

  it('STILL audits genuine technical duration metrics (e.g. "reduced deployment time by 15 minutes") against candidate profile', () => {
    const unverifiedTechnicalDurationText =
      'Optimized CI/CD pipeline and reduced deployment time by 15 minutes across all services.';

    const validation = validationService.validateFreeText(
      unverifiedTechnicalDurationText,
      juniorCandidateFixture,
      'Cover Letter',
    );

    // Junior candidate profile does NOT have "15" or "15 minutes" in source text, so it MUST be flagged for audit!
    const flagged15 = validation.numberFlags.some((f) =>
      f.flaggedNumbers.some((num) => num === '15'),
    );
    expect(flagged15).toBe(true);
  });
});
