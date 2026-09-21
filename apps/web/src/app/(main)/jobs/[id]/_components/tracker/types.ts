import type { ApplicationTracker, InterviewStage } from '@praman/schemas';

export interface DossierFormData {
  appliedDate: string;
  portalUrl: string;
  targetSalary: string;
  referralContact: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterPhone: string;
}

export interface MilestoneFormData {
  stage: InterviewStage;
  title: string;
  scheduledAt: string;
  meetingLink: string;
  interviewer: string;
  notes: string;
}

export interface JobTrackerHubProps {
  jobId: string;
  status: string;
  tracker?: ApplicationTracker | null;
  jobTitle?: string | null;
}
