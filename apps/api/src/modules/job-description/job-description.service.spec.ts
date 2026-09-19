import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobDescriptionService } from './job-description.service.js';

describe('JobDescriptionService', () => {
  let service: JobDescriptionService;
  let mockPrisma: any;
  let mockAiService: any;
  let mockCandidateService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        orm: {
          public: {
            JobDescription: {
              where: vi.fn(),
              create: vi.fn(),
            },
            CandidateJdAnalysis: {
              where: vi.fn(),
            },
            ResumeStrategy: {
              where: vi.fn(),
            },
            Resume: {
              where: vi.fn(),
            },
          },
        },
      },
    };

    mockAiService = {
      runStructuredCall: vi.fn(),
    };

    mockCandidateService = {
      getDefaultUser: vi.fn().mockResolvedValue({ id: 'user-default' }),
    };

    service = new JobDescriptionService(mockPrisma, mockAiService, mockCandidateService);
  });

  describe('deleteJd', () => {
    it('throws NotFoundException if job description is not found', async () => {
      mockPrisma.client.orm.public.JobDescription.where.mockReturnValue({
        include: () => ({
          first: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.deleteJd('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if job description belongs to another user', async () => {
      mockPrisma.client.orm.public.JobDescription.where.mockReturnValue({
        include: () => ({
          first: vi.fn().mockResolvedValue({ id: 'jd-1', userId: 'user-other', analysis: null }),
        }),
      });

      await expect(service.deleteJd('jd-1', 'user-owner')).rejects.toThrow(NotFoundException);
    });

    it('cascades deletion through resume, strategy, analysis, and jd', async () => {
      const mockJd = {
        id: 'jd-1',
        userId: 'user-1',
        analysis: { id: 'analysis-1' },
      };

      const mockStrategy = {
        id: 'strategy-1',
      };

      const mockResumes = [{ id: 'resume-1' }, { id: 'resume-2' }];

      const deleteJdMock = vi.fn().mockResolvedValue({ id: 'jd-1' });
      const deleteAnalysisMock = vi.fn().mockResolvedValue({ id: 'analysis-1' });
      const deleteStrategyMock = vi.fn().mockResolvedValue({ id: 'strategy-1' });
      const deleteResumeMock = vi.fn().mockResolvedValue({ count: 1 });

      mockPrisma.client.orm.public.JobDescription.where.mockImplementation((query: any) => {
        if (query.id === 'jd-1' && !query.userId) {
          return {
            include: () => ({
              first: vi.fn().mockResolvedValue(mockJd),
            }),
            delete: deleteJdMock,
          };
        }
        return {
          delete: deleteJdMock,
        };
      });

      mockPrisma.client.orm.public.CandidateJdAnalysis.where.mockReturnValue({
        delete: deleteAnalysisMock,
      });

      mockPrisma.client.orm.public.ResumeStrategy.where.mockImplementation((query: any) => {
        if (query.candidateJdAnalysisId === 'analysis-1') {
          return {
            first: vi.fn().mockResolvedValue(mockStrategy),
          };
        }
        return {
          delete: deleteStrategyMock,
        };
      });

      mockPrisma.client.orm.public.Resume.where.mockImplementation((query: any) => {
        if (query.resumeStrategyId === 'strategy-1') {
          return {
            all: vi.fn().mockResolvedValue(mockResumes),
          };
        }
        return {
          delete: deleteResumeMock,
        };
      });

      const result = await service.deleteJd('jd-1', 'user-1');

      expect(result.success).toBe(true);
      expect(deleteResumeMock).toHaveBeenCalledTimes(2);
      expect(deleteStrategyMock).toHaveBeenCalledTimes(1);
      expect(deleteAnalysisMock).toHaveBeenCalledTimes(1);
      expect(deleteJdMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException if job description is not found', async () => {
      mockPrisma.client.orm.public.JobDescription.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });

      await expect(service.updateStatus('jd-missing', 'APPLIED')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if job description belongs to another user', async () => {
      mockPrisma.client.orm.public.JobDescription.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: 'jd-1', userId: 'user-other' }),
      });

      await expect(service.updateStatus('jd-1', 'APPLIED', 'user-owner')).rejects.toThrow(NotFoundException);
    });

    it('successfully updates application status', async () => {
      const updateMock = vi.fn().mockResolvedValue({ id: 'jd-1', status: 'APPLIED' });
      mockPrisma.client.orm.public.JobDescription.where.mockImplementation((query: any) => {
        return {
          first: vi.fn().mockResolvedValue({ id: 'jd-1', userId: 'user-owner', status: 'SAVED' }),
          update: updateMock,
        };
      });

      const result = await service.updateStatus('jd-1', 'APPLIED', 'user-owner');
      expect(result.status).toBe('APPLIED');
      expect(updateMock).toHaveBeenCalledWith({ status: 'APPLIED' });
    });
  });

  describe('createAndAnalyze', () => {
    it('throws ConflictException if duplicate JD text exists and force is false', async () => {
      const existingRaw = 'Software Engineer with 5+ years experience in React and Node.';
      mockPrisma.client.orm.public.JobDescription.where.mockReturnValue({
        include: () => ({
          all: vi.fn().mockResolvedValue([
            {
              id: 'existing-1',
              rawText: '  Software Engineer with 5+ years experience in React and Node.  ',
              structured: { jobTitle: 'Senior Software Engineer' },
              status: 'SAVED',
              analysis: { matchScore: 85 },
              createdAt: '2026-09-01T00:00:00Z',
            },
          ]),
        }),
      });

      await expect(
        service.createAndAnalyze(existingRaw, 'user-1', false),
      ).rejects.toThrowError(/identical content/i);
    });

    it('proceeds with creation if force is true even if duplicate text exists', async () => {
      const existingRaw = 'Software Engineer with 5+ years experience in React and Node.';
      mockAiService.runStructuredCall.mockResolvedValue({
        jobTitle: 'Senior Software Engineer',
        requiredSkills: ['React', 'Node'],
      });
      const createMock = vi.fn().mockResolvedValue({
        id: 'new-jd',
        userId: 'user-1',
        rawText: existingRaw,
        structured: { jobTitle: 'Senior Software Engineer' },
      });
      mockPrisma.client.orm.public.JobDescription.create = createMock;

      const result = await service.createAndAnalyze(existingRaw, 'user-1', true);
      expect(result.id).toBe('new-jd');
      expect(createMock).toHaveBeenCalled();
    });
  });
});
