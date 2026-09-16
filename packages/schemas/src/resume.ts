import { z } from 'zod';

export const ResumeStatusEnum = z.enum(['DRAFT', 'VALIDATED', 'REJECTED']);
export type ResumeStatus = z.infer<typeof ResumeStatusEnum>;

export const ResumePersonalSchema = z.object({
  name: z.string().min(1),
  contact: z.record(z.string()).default({}),
});
export type ResumePersonal = z.infer<typeof ResumePersonalSchema>;

export const ResumeExperienceItemSchema = z.object({
  sourceExperienceId: z
    .string()
    .describe('Must strictly match an existing candidate Experience ID'),
  company: z.string(),
  title: z.string(),
  bullets: z.array(z.string()).min(1, 'At least one bullet is required'),
});
export type ResumeExperienceItem = z.infer<typeof ResumeExperienceItemSchema>;

export const ResumeProjectItemSchema = z.object({
  sourceProjectId: z.string().describe('Must strictly match an existing candidate Project ID'),
  name: z.string(),
  bullets: z.array(z.string()).min(1, 'At least one bullet is required'),
});
export type ResumeProjectItem = z.infer<typeof ResumeProjectItemSchema>;

export const ResumeEducationItemSchema = z.object({
  sourceEducationId: z.string().describe('Must strictly match an existing candidate Education ID'),
  institution: z.string().optional(),
  degree: z.string().optional(),
});
export type ResumeEducationItem = z.infer<typeof ResumeEducationItemSchema>;

export const ResumeCertificationItemSchema = z.object({
  sourceCertificationId: z
    .string()
    .describe('Must strictly match an existing candidate Certification ID'),
  name: z.string().optional(),
});
export type ResumeCertificationItem = z.infer<typeof ResumeCertificationItemSchema>;

export const ResumeSchema = z.object({
  personal: ResumePersonalSchema,
  summary: z.string().min(1, 'Professional summary is required'),
  experience: z.array(ResumeExperienceItemSchema).default([]),
  projects: z.array(ResumeProjectItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  education: z.array(ResumeEducationItemSchema).default([]),
  certifications: z.array(ResumeCertificationItemSchema).optional().default([]),
});
export type ResumeData = z.infer<typeof ResumeSchema>;

// Deterministic evidence validation report (§8)
export const SourceIdCheckSchema = z.object({
  field: z.string(),
  sourceId: z.string(),
  exists: z.boolean(),
  details: z.string().optional(),
});
export type SourceIdCheck = z.infer<typeof SourceIdCheckSchema>;

export const SkillCheckSchema = z.object({
  skill: z.string(),
  existsInProfile: z.boolean(),
  candidateLevel: z.string().optional(),
  isAllowed: z.boolean(),
  violation: z.string().optional(),
});
export type SkillCheck = z.infer<typeof SkillCheckSchema>;

export const NumberFlagSchema = z.object({
  location: z.string(),
  bullet: z.string(),
  flaggedNumbers: z.array(z.string()),
  reason: z.string(),
});
export type NumberFlag = z.infer<typeof NumberFlagSchema>;

export const ValidationReportSchema = z.object({
  schemaValid: z.boolean(),
  status: ResumeStatusEnum,
  violations: z.array(z.string()).default([]),
  sourceIdChecks: z.array(SourceIdCheckSchema).default([]),
  skillChecks: z.array(SkillCheckSchema).default([]),
  numberFlags: z.array(NumberFlagSchema).default([]),
  checkedAt: z.string().optional(),
});
export type ValidationReport = z.infer<typeof ValidationReportSchema>;
