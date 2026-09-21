import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CandidateService } from './candidate.service.js';

describe('CandidateService - batchImportProfile', () => {
  let service: CandidateService;
  let mockPrisma: any;

  beforeEach(() => {
    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      personal: {
        name: 'Old Name',
        title: 'Old Title',
        contact: { email: 'old@example.com' },
        links: { github: 'https://github.com/old' },
      },
      experiences: [],
      skills: [],
      educations: [],
      projects: [],
      certifications: [],
    };

    const mockCandidateProfileQuery = {
      include: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(mockProfile),
      update: vi.fn().mockResolvedValue(mockProfile),
    };

    mockPrisma = {
      client: {
        orm: {
          public: {
            User: {
              where: vi
                .fn()
                .mockReturnValue({ first: vi.fn().mockResolvedValue({ id: 'user-1' }) }),
              first: vi.fn().mockResolvedValue({ id: 'user-1' }),
            },
            CandidateProfile: {
              where: vi.fn().mockReturnValue(mockCandidateProfileQuery),
              create: vi.fn().mockResolvedValue(mockProfile),
            },
            Experience: {
              where: vi
                .fn()
                .mockReturnValue({ deleteAll: vi.fn().mockResolvedValue({ count: 1 }) }),
              create: vi.fn().mockResolvedValue({ id: 'exp-1' }),
            },
            Education: {
              where: vi
                .fn()
                .mockReturnValue({ deleteAll: vi.fn().mockResolvedValue({ count: 1 }) }),
              create: vi.fn().mockResolvedValue({ id: 'edu-1' }),
            },
            Skill: {
              where: vi.fn().mockReturnValue({
                deleteAll: vi.fn().mockResolvedValue({ count: 1 }),
                all: vi.fn().mockResolvedValue([{ name: 'React' }]),
              }),
              create: vi.fn().mockResolvedValue({ id: 'skill-1' }),
            },
            Project: {
              where: vi
                .fn()
                .mockReturnValue({ deleteAll: vi.fn().mockResolvedValue({ count: 1 }) }),
              create: vi.fn().mockResolvedValue({ id: 'proj-1' }),
            },
            Certification: {
              where: vi
                .fn()
                .mockReturnValue({ deleteAll: vi.fn().mockResolvedValue({ count: 1 }) }),
              create: vi.fn().mockResolvedValue({ id: 'cert-1' }),
            },
          },
        },
      },
    };

    service = new CandidateService(mockPrisma);
  });

  it('correctly imports in merge mode without deleting existing entities', async () => {
    const payload = {
      mode: 'merge' as const,
      data: {
        personal: {
          name: 'New Name',
          title: 'Staff Engineer',
          contact: { phone: '123-456' },
        },
        experiences: [
          {
            title: 'Lead Architect',
            company: 'Tech Corp',
            startDate: '2022',
            endDate: null,
            isCurrent: true,
            responsibilities: ['Led system overhaul'],
            technologies: ['TypeScript'],
            achievements: [],
          },
        ],
        skills: [
          { name: 'React', level: 'EXPERIENCED' as const, evidence: null }, // Duplicate in existing, should skip
          { name: 'Node.js', level: 'WORKING_KNOWLEDGE' as const, evidence: null },
        ],
        educations: [
          {
            institution: 'MIT',
            degree: 'BS CS',
            field: null,
            startDate: '2015',
            endDate: '2019',
            details: null,
          },
        ],
        projects: [],
        certifications: [],
        meta: { detectedSections: [], characterCount: 50, parsingTimeMs: 5 },
      },
    };

    const res = await service.batchImportProfile(payload, 'user-1');

    expect(res).toBeDefined();
    // In merge mode, deleteAll should NOT be called
    expect(mockPrisma.client.orm.public.Experience.where().deleteAll).not.toHaveBeenCalled();

    // Experiences created
    expect(mockPrisma.client.orm.public.Experience.create).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateProfileId: 'profile-1',
        title: 'Lead Architect',
        company: 'Tech Corp',
      }),
    );

    // React is already present, so Skill.create should only be called once for Node.js
    expect(mockPrisma.client.orm.public.Skill.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.client.orm.public.Skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Node.js',
      }),
    );
  });

  it('correctly cleans old sub-entities in replace mode', async () => {
    const payload = {
      mode: 'replace' as const,
      data: {
        personal: {
          name: 'Replaced Name',
        },
        experiences: [],
        skills: [{ name: 'Rust', level: 'WORKING_KNOWLEDGE' as const, evidence: null }],
        educations: [],
        projects: [],
        certifications: [],
        meta: { detectedSections: [], characterCount: 50, parsingTimeMs: 5 },
      },
    };

    await service.batchImportProfile(payload, 'user-1');

    // In replace mode, all sub-entities should have deleteAll called
    expect(mockPrisma.client.orm.public.Experience.where().deleteAll).toHaveBeenCalled();
    expect(mockPrisma.client.orm.public.Education.where().deleteAll).toHaveBeenCalled();
    expect(mockPrisma.client.orm.public.Skill.where().deleteAll).toHaveBeenCalled();
    expect(mockPrisma.client.orm.public.Project.where().deleteAll).toHaveBeenCalled();
    expect(mockPrisma.client.orm.public.Certification.where().deleteAll).toHaveBeenCalled();

    // New skill created
    expect(mockPrisma.client.orm.public.Skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Rust',
      }),
    );
  });
});
