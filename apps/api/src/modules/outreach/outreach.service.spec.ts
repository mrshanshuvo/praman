import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OutreachService } from './outreach.service.js';

describe('OutreachService (Cover Letter & Recruiter Outreach Email)', () => {
  let service: OutreachService;
  let mockPrisma: any;
  let mockAiService: any;
  let mockCandidateService: any;

  let storedResume: any = null;

  beforeEach(() => {
    storedResume = {
      id: 'resume-1',
      resumeStrategyId: 'strategy-1',
      resumeJson: {
        personal: { name: 'Shahid Hasan Shuvo' },
        summary: 'Experienced Full-Stack Developer',
      },
    };

    mockPrisma = {
      client: {
        orm: {
          public: {
            JobDescription: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue({
                  id: 'jd-1',
                  userId: 'user-1',
                  structured: {
                    title: 'Full-Stack Developer',
                    company: 'Softvence Agency',
                    requiredSkills: ['TypeScript', 'NestJS'],
                  },
                }),
              }),
            },
            CandidateJdAnalysis: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue({
                  id: 'analysis-1',
                  jobDescriptionId: 'jd-1',
                  result: {
                    strongMatches: ['TypeScript', 'NestJS'],
                    missingSkills: [],
                    doNotClaim: ['Kubernetes'],
                  },
                }),
              }),
            },
            ResumeStrategy: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue({
                  id: 'strategy-1',
                  candidateJdAnalysisId: 'analysis-1',
                  result: {
                    narrativeGuidance:
                      'Highlight full-stack capabilities and verified performance.',
                  },
                }),
              }),
            },
            Resume: {
              where: vi.fn().mockImplementation((_query: any) => ({
                first: vi.fn().mockImplementation(async () => storedResume),
                update: vi.fn().mockImplementation(async (data: any) => {
                  storedResume = {
                    ...storedResume,
                    resumeJson: data.resumeJson,
                  };
                  return storedResume;
                }),
              })),
            },
          },
        },
      },
    };

    mockCandidateService = {
      getFullProfile: vi.fn().mockResolvedValue({
        personal: {
          name: 'Shahid Hasan Shuvo',
          contact: { email: 'mrshanshuvo@gmail.com', phone: '+8801929346733' },
        },
        experiences: [
          {
            id: 'exp-1',
            company: 'Softvence Agency',
            title: 'Jr. Full Stack Developer',
            achievements: ['Reduced API latency by 35%'],
          },
        ],
        projects: [
          {
            id: 'proj-1',
            name: 'CareCamp',
            description: 'Medical management platform',
          },
        ],
        skills: [{ name: 'TypeScript', level: 'EXPERIENCED' }],
      }),
    };

    mockAiService = {
      runStructuredCall: vi.fn().mockImplementation(async (params: any) => {
        if (params.schemaName === 'CoverLetter') {
          return {
            recipientName: 'Hiring Team',
            companyName: 'Softvence Agency',
            jobTitle: 'Full-Stack Developer',
            opening: 'I am excited to apply for the Full-Stack Developer position.',
            bodyParagraphs: [
              'At Softvence Agency, I built high-throughput REST APIs with NestJS.',
              'I also created CareCamp, processing transactional operations reliably.',
            ],
            closing: 'I look forward to discussing how I can contribute.',
            signOff: 'Sincerely,',
            senderName: 'Shahid Hasan Shuvo',
            senderContact: { email: 'mrshanshuvo@gmail.com' },
          };
        }
        if (params.schemaName === 'RecruiterEmail') {
          return {
            subject: 'Application: Full-Stack Developer — Shahid Hasan Shuvo',
            salutation: 'Hi Hiring Team,',
            hook: 'I noticed your opening for a Full-Stack Developer and wanted to reach out directly.',
            highlights: [
              'Production NestJS & Next.js full-stack capabilities.',
              'Verified 35% API latency reduction in production.',
            ],
            callToAction: 'Would you be open to a 10-minute chat this week?',
            signOff: 'Best regards,',
            senderName: 'Shahid Hasan Shuvo',
          };
        }
        throw new Error(`Unexpected schema: ${params.schemaName}`);
      }),
    };

    service = new OutreachService(mockPrisma, mockAiService, mockCandidateService);
  });

  it('generates tailored cover letter and generates valid matching LaTeX', async () => {
    const res = await service.generateCoverLetter('jd-1');

    expect(res.coverLetter.companyName).toBe('Softvence Agency');
    expect(res.coverLetter.bodyParagraphs).toHaveLength(2);
    expect(res.coverLetterLatex).toContain('\\documentclass');
    expect(res.coverLetterLatex).toContain('Softvence Agency');
    expect(res.coverLetterLatex).toContain('Shahid Hasan Shuvo');

    // Verify stored in resumeJson.outreach
    expect(storedResume.resumeJson.outreach.coverLetter).toBeDefined();
    expect(storedResume.resumeJson.outreach.coverLetterLatex).toBeDefined();
  });

  it('generates recruiter cold email with punchy highlights and subject line', async () => {
    const res = await service.generateRecruiterEmail('jd-1');

    expect(res.recruiterEmail.subject).toContain('Full-Stack Developer');
    expect(res.recruiterEmail.highlights).toHaveLength(2);
    expect(res.recruiterEmail.callToAction).toContain('10-minute chat');

    // Verify stored in resumeJson.outreach
    expect(storedResume.resumeJson.outreach.recruiterEmail).toBeDefined();
  });

  it('retrieves saved outreach materials gracefully', async () => {
    // Generate both
    await service.generateCoverLetter('jd-1');
    await service.generateRecruiterEmail('jd-1');

    const outreach = await service.getOutreach('jd-1');
    expect(outreach.coverLetter).toBeDefined();
    expect(outreach.coverLetterLatex).toBeDefined();
    expect(outreach.recruiterEmail).toBeDefined();
    expect(outreach.recruiterEmail.subject).toContain('Full-Stack Developer');
  });
});
