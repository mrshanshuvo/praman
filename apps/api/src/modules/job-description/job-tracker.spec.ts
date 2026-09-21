import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobDescriptionService } from './job-description.service.js';

describe('JobDescriptionService - Tracker, Milestones & Notes', () => {
  let service: JobDescriptionService;
  let mockPrisma: any;
  let mockAiService: any;
  let mockCandidateService: any;
  let storedJd: any;

  beforeEach(() => {
    storedJd = {
      id: 'jd-123',
      userId: 'user-1',
      status: 'APPLIED',
      rawText: 'Senior Engineer at Acme',
      structured: { jobTitle: 'Senior Engineer' },
      tracker: {
        appliedDate: '2026-09-15',
        targetSalary: '$160,000',
        milestones: [],
        notes: [],
      },
    };

    mockPrisma = {
      client: {
        orm: {
          public: {
            JobDescription: {
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockImplementation(() => Promise.resolve(storedJd)),
                update: vi.fn().mockImplementation((payload) => {
                  storedJd = { ...storedJd, ...payload };
                  return Promise.resolve(storedJd);
                }),
              }),
            },
          },
        },
      },
    };

    mockAiService = {};
    mockCandidateService = {
      getDefaultUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
    };

    service = new JobDescriptionService(mockPrisma, mockAiService, mockCandidateService);
  });

  it('updates the application dossier while preserving milestones and notes', async () => {
    const updated = await service.updateTrackerDossier(
      'jd-123',
      {
        appliedDate: '2026-09-20',
        targetSalary: '$175,000 + Equity',
        recruiterName: 'Sarah Connor',
        recruiterEmail: 'sarah@acme.corp',
      },
      'user-1',
    );

    expect(updated.appliedDate).toBe('2026-09-20');
    expect(updated.targetSalary).toBe('$175,000 + Equity');
    expect(updated.recruiterName).toBe('Sarah Connor');
    expect(updated.recruiterEmail).toBe('sarah@acme.corp');
  });

  it('adds an interview milestone and automatically updates status to INTERVIEWING', async () => {
    expect(storedJd.status).toBe('APPLIED');

    const milestone = await service.addMilestone(
      'jd-123',
      {
        stage: 'TECHNICAL',
        title: 'Technical Deep Dive with Staff Engineer',
        scheduledAt: '2026-09-25T14:00:00Z',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        interviewer: 'Alex Mercer (Staff Eng)',
        questionsAsked: ['How do you handle distributed locks?'],
      },
      'user-1',
    );

    expect(milestone.id).toBeDefined();
    expect(milestone.roundNumber).toBe(1);
    expect(milestone.stage).toBe('TECHNICAL');
    expect(milestone.status).toBe('SCHEDULED');

    // Auto-promotion test
    expect(storedJd.status).toBe('INTERVIEWING');
  });

  it('updates and deletes an interview milestone', async () => {
    const milestone = await service.addMilestone(
      'jd-123',
      {
        stage: 'SCREENING',
        title: 'Recruiter Call',
      },
      'user-1',
    );

    const updated = await service.updateMilestone(
      'jd-123',
      milestone.id,
      {
        status: 'COMPLETED',
        notes: 'Great conversation, moving to technical round next week',
      },
      'user-1',
    );

    expect(updated.status).toBe('COMPLETED');
    expect(updated.notes).toContain('Great conversation');

    // Delete
    const delResult = await service.deleteMilestone('jd-123', milestone.id, 'user-1');
    expect(delResult.success).toBe(true);

    const tracker = await service.getTracker('jd-123', 'user-1');
    expect(tracker.milestones.length).toBe(0);
  });

  it('adds, pins, and deletes application notes', async () => {
    const note1 = await service.addNote(
      'jd-123',
      {
        content: 'Review microservices design patterns before Tuesday',
        tag: 'PREP',
        isPinned: true,
      },
      'user-1',
    );

    expect(note1.id).toBeDefined();
    expect(note1.tag).toBe('PREP');
    expect(note1.isPinned).toBe(true);

    const updatedNote = await service.updateNote(
      'jd-123',
      note1.id,
      {
        isPinned: false,
      },
      'user-1',
    );
    expect(updatedNote.isPinned).toBe(false);

    const del = await service.deleteNote('jd-123', note1.id, 'user-1');
    expect(del.success).toBe(true);

    const tracker = await service.getTracker('jd-123', 'user-1');
    expect(tracker.notes.length).toBe(0);
  });
});
