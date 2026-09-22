import { z } from 'zod';
import type { MatchAnalysis } from './match';
import type { ResumeRecord } from './resume';
import type { ResumeStrategy } from './strategy';

export const StructuredJdSchema = z.object({
  jobTitle: z.string().describe('The primary title of the job opening'),
  company: z.string().nullable().optional().describe('Company or hiring organization if specified'),
  seniority: z
    .string()
    .nullable()
    .optional()
    .describe('Level of seniority requested (e.g. Junior, Mid, Senior, Lead, Staff)'),
  requiredSkills: z
    .array(z.string())
    .default([])
    .describe('Core mandatory skills explicitly requested'),
  preferredSkills: z
    .array(z.string())
    .default([])
    .describe('Nice-to-have or preferred technical/functional skills'),
  yearsOfExperience: z
    .string()
    .nullable()
    .optional()
    .describe('Expected years of experience or range if specified'),
  responsibilities: z
    .array(z.string())
    .default([])
    .describe('Key day-to-day responsibilities and tasks'),
  educationRequirements: z
    .array(z.string())
    .nullable()
    .optional()
    .describe('Degrees or education criteria if stated'),
  locationOrWorkMode: z
    .string()
    .nullable()
    .optional()
    .describe('Remote, Hybrid, On-site, or specific city/country'),
  salary: z.string().nullable().optional().describe('Compensation range or notes if listed'),
  mustHave: z
    .array(z.string())
    .default([])
    .describe('Hard prerequisites that candidates must possess'),
  niceToHave: z.array(z.string()).default([]).describe('Bonus qualifications or differentiators'),
  otherNotes: z
    .array(z.string())
    .nullable()
    .optional()
    .describe('Cultural or operational notes, perks, or constraints'),
});
export type StructuredJd = z.infer<typeof StructuredJdSchema>;

export const CreateJobDescriptionDtoSchema = z.object({
  rawText: z.string().min(10, 'Job description must be at least 10 characters long'),
  force: z.boolean().optional(),
});
export type CreateJobDescriptionDto = z.infer<typeof CreateJobDescriptionDtoSchema>;

export const ApplicationStatusSchema = z.enum([
  'SAVED',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const UpdateJobStatusDtoSchema = z.object({
  status: ApplicationStatusSchema,
});
export type UpdateJobStatusDto = z.infer<typeof UpdateJobStatusDtoSchema>;

export const InterviewStageEnum = z.enum([
  'SCREENING',
  'TECHNICAL',
  'TAKE_HOME',
  'SYSTEM_DESIGN',
  'BEHAVIORAL',
  'HIRING_MANAGER',
  'FINAL_ROUND',
  'OFFER',
  'CUSTOM',
]);
export type InterviewStage = z.infer<typeof InterviewStageEnum>;

export const MilestoneStatusEnum = z.enum([
  'SCHEDULED',
  'COMPLETED',
  'PASSED',
  'NEEDS_FOLLOW_UP',
  'CANCELLED',
]);
export type MilestoneStatus = z.infer<typeof MilestoneStatusEnum>;

export const InterviewMilestoneSchema = z.object({
  id: z.string(),
  roundNumber: z.number().default(1),
  stage: InterviewStageEnum,
  title: z.string().min(1, 'Milestone title is required'),
  scheduledAt: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  status: MilestoneStatusEnum.default('SCHEDULED'),
  interviewer: z.string().nullable().optional(),
  meetingLink: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  questionsAsked: z.array(z.string()).default([]),
  createdAt: z.string(),
});
export type InterviewMilestone = z.infer<typeof InterviewMilestoneSchema>;

export const CreateMilestoneDtoSchema = z.object({
  stage: InterviewStageEnum,
  title: z.string().min(1, 'Milestone title is required'),
  roundNumber: z.number().optional(),
  scheduledAt: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  status: MilestoneStatusEnum.optional(),
  interviewer: z.string().nullable().optional(),
  meetingLink: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  questionsAsked: z.array(z.string()).optional(),
});
export type CreateMilestoneDto = z.infer<typeof CreateMilestoneDtoSchema>;

export const UpdateMilestoneDtoSchema = CreateMilestoneDtoSchema.partial();
export type UpdateMilestoneDto = z.infer<typeof UpdateMilestoneDtoSchema>;

export const NoteTagEnum = z.enum([
  'GENERAL',
  'PREP',
  'INTERVIEW_FEEDBACK',
  'SALARY_BENEFITS',
  'RECRUITER_INTEL',
  'FOLLOW_UP',
]);
export type NoteTag = z.infer<typeof NoteTagEnum>;

export const ApplicationNoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1, 'Note content cannot be empty'),
  tag: NoteTagEnum.default('GENERAL'),
  isPinned: z.boolean().default(false),
  createdAt: z.string(),
});
export type ApplicationNote = z.infer<typeof ApplicationNoteSchema>;

export const CreateNoteDtoSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
  tag: NoteTagEnum.default('GENERAL').optional(),
  isPinned: z.boolean().default(false).optional(),
});
export type CreateNoteDto = z.infer<typeof CreateNoteDtoSchema>;

export const UpdateNoteDtoSchema = CreateNoteDtoSchema.partial();
export type UpdateNoteDto = z.infer<typeof UpdateNoteDtoSchema>;

export const ApplicationTrackerSchema = z.object({
  appliedDate: z.string().nullable().optional(),
  portalUrl: z.string().nullable().optional(),
  targetSalary: z.string().nullable().optional(),
  referralContact: z.string().nullable().optional(),
  recruiterName: z.string().nullable().optional(),
  recruiterEmail: z.string().nullable().optional(),
  recruiterPhone: z.string().nullable().optional(),
  milestones: z.array(InterviewMilestoneSchema).default([]),
  notes: z.array(ApplicationNoteSchema).default([]),
});
export type ApplicationTracker = z.infer<typeof ApplicationTrackerSchema>;

export const UpdateApplicationTrackerDtoSchema = z.object({
  appliedDate: z.string().nullable().optional(),
  portalUrl: z.string().nullable().optional(),
  targetSalary: z.string().nullable().optional(),
  referralContact: z.string().nullable().optional(),
  recruiterName: z.string().nullable().optional(),
  recruiterEmail: z.string().nullable().optional(),
  recruiterPhone: z.string().nullable().optional(),
});
export type UpdateApplicationTrackerDto = z.infer<typeof UpdateApplicationTrackerDtoSchema>;

export interface CandidateJdAnalysisRecord {
  id: string;
  jobDescriptionId: string;
  result: MatchAnalysis | null;
  matchScore?: number | null;
  matchLabel?: string | null;
  createdAt: string;
  updatedAt: string;
  strategy?: {
    id: string;
    candidateJdAnalysisId: string;
    result: ResumeStrategy | null;
    resume?: ResumeRecord | null;
    resumes?: ResumeRecord[];
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface JobDescriptionRecord {
  id: string;
  userId: string;
  rawText: string;
  structured: StructuredJd;
  status: ApplicationStatus;
  tracker?: ApplicationTracker | null;
  createdAt: string;
  updatedAt: string;
  analysis?: CandidateJdAnalysisRecord | null;
}
