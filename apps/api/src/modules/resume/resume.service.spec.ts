import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumeService } from './resume.service.js';

describe('ResumeService (Version History & User Scoping)', () => {
  let service: ResumeService;
  let mockPrisma: any;
  let mockAiService: any;
  let mockCandidateService: any;
  let mockValidationService: any;
  let mockLatexService: any;
  let mockHtmlPdfService: any;
  let mockStorageService: any;

  let storedResumes: any[] = [];

  beforeEach(() => {
    storedResumes = [];

    mockPrisma = {
      client: {
        orm: {
          public: {
            JobDescription: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue({
                  id: 'jd-1',
                  userId: 'user-1',
                  structured: { jobTitle: 'Full-Stack Developer' },
                }),
              }),
            },
            CandidateJdAnalysis: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue({
                  id: 'analysis-1',
                  jobDescriptionId: 'jd-1',
                  result: {},
                }),
              }),
            },
            ResumeStrategy: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue({
                  id: 'strategy-1',
                  candidateJdAnalysisId: 'analysis-1',
                  result: {},
                }),
              }),
            },
            Resume: {
              where: vi.fn().mockImplementation((query: any) => ({
                first: vi.fn().mockImplementation(async () => {
                  if (query.version) {
                    return storedResumes.find((r) => r.version === query.version) || null;
                  }
                  if (query.isLatest) {
                    return storedResumes.find((r) => r.isLatest) || null;
                  }
                  if (query.id) {
                    return storedResumes.find((r) => r.id === query.id) || null;
                  }
                  return storedResumes[0] || null;
                }),
                all: vi.fn().mockImplementation(async () => storedResumes),
                update: vi.fn().mockImplementation(async (data: any) => {
                  const target = storedResumes.find((r) => r.id === query.id);
                  if (target) {
                    Object.assign(target, data);
                  }
                  return target;
                }),
              })),
              create: vi.fn().mockImplementation(async (data: any) => {
                const newRecord = {
                  id: `resume-${storedResumes.length + 1}`,
                  ...data,
                };
                storedResumes.push(newRecord);
                return newRecord;
              }),
            },
          },
        },
      },
    };

    mockAiService = {
      runStructuredCall: vi.fn().mockResolvedValue({
        personal: { name: 'Shahid Hasan Shuvo' },
        summary: 'Experienced Engineer',
        skills: ['TypeScript', 'NestJS'],
      }),
    };

    mockCandidateService = {
      getProfile: vi.fn().mockResolvedValue({
        personal: { name: 'Shahid Hasan Shuvo' },
        skills: [{ name: 'TypeScript', level: 'EXPERIENCED' }],
      }),
      getSanitizedProfile: vi.fn().mockResolvedValue({
        personal: { name: 'Shahid Hasan Shuvo' },
        skills: [{ name: 'TypeScript', level: 'EXPERIENCED' }],
      }),
    };

    mockValidationService = {
      validateResume: vi.fn().mockReturnValue({
        status: 'VALIDATED',
        violations: [],
        skillChecks: [],
        numberFlags: [],
      }),
    };

    mockLatexService = {
      generateLatex: vi.fn().mockResolvedValue('\\documentclass{article}'),
    };

    mockHtmlPdfService = {
      generatePdf: vi.fn().mockResolvedValue(Buffer.from('mock pdf')),
    };

    mockStorageService = {
      uploadFile: vi.fn().mockResolvedValue(true),
      getPresignedDownloadUrl: vi.fn().mockResolvedValue('https://download.url/test.pdf'),
    };

    service = new ResumeService(
      mockPrisma,
      mockAiService,
      mockCandidateService,
      mockValidationService,
      mockLatexService,
      mockHtmlPdfService,
      mockStorageService,
    );
  });

  it('creates sequentially versioned resumes without overwriting previous versions', async () => {
    // 1st Generation -> Version 1
    const v1 = await service.generateAndValidate('jd-1', 'user-1');
    expect(v1.version).toBe(1);
    expect(v1.isLatest).toBe(true);
    expect(storedResumes).toHaveLength(1);

    // 2nd Generation -> Version 2, Version 1 is marked isLatest: false
    const v2 = await service.generateAndValidate('jd-1', 'user-1');
    expect(v2.version).toBe(2);
    expect(v2.isLatest).toBe(true);
    expect(storedResumes).toHaveLength(2);

    const firstResume = storedResumes.find((r) => r.version === 1);
    expect(firstResume.isLatest).toBe(false);
  });

  it('lists all resume versions sorted descending by version', async () => {
    await service.generateAndValidate('jd-1', 'user-1');
    await service.generateAndValidate('jd-1', 'user-1');

    const versions = await service.getResumeVersions('jd-1', 'user-1');
    expect(versions).toHaveLength(2);
    expect(versions[0].version).toBe(2);
    expect(versions[1].version).toBe(1);
  });

  it('retrieves specific historical version when requested', async () => {
    await service.generateAndValidate('jd-1', 'user-1');
    await service.generateAndValidate('jd-1', 'user-1');

    const historical = await service.getLatestResume('jd-1', '1', 'user-1');
    expect(historical?.version).toBe(1);

    const latest = await service.getLatestResume('jd-1', undefined, 'user-1');
    expect(latest?.version).toBe(2);
  });
});
