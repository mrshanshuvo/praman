import { z } from 'zod';

export const SkillLevelEnum = z.enum([
  'EXPERIENCED',
  'WORKING_KNOWLEDGE',
  'LEARNING',
  'NOT_LEARNED',
]);
export type SkillLevel = z.infer<typeof SkillLevelEnum>;

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Skill name is required'),
  level: SkillLevelEnum,
  evidence: z.string().optional().nullable(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, 'Company is required'),
  title: z.string().min(1, 'Job title is required'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  responsibilities: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  technologies: z.array(z.string()).default([]),
  role: z.string().optional().nullable(),
  outcomes: z.array(z.string()).default([]),
  link: z.string().optional().nullable(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
});
export type Education = z.infer<typeof EducationSchema>;

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
});
export type Certification = z.infer<typeof CertificationSchema>;

export const CandidatePersonalSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    title: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    achievements: z.array(z.string()).optional().default([]),
    languages: z.array(z.string()).optional().default([]),
    contact: z.record(z.string()).default({}),
    links: z.record(z.string()).default({}),
  })
  .passthrough();
export type CandidatePersonal = z.infer<typeof CandidatePersonalSchema>;

export const UpdateCandidatePersonalSchema = CandidatePersonalSchema.partial();
export type UpdateCandidatePersonal = z.infer<typeof UpdateCandidatePersonalSchema>;

export const CandidateProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  personal: CandidatePersonalSchema,
  educations: z.array(EducationSchema).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
});
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

// DTOs for adding/editing items (where id may be omitted or generated on backend)
export const CreateSkillDtoSchema = SkillSchema.omit({ id: true });
export type CreateSkillDto = z.infer<typeof CreateSkillDtoSchema>;
export const UpdateSkillDtoSchema = CreateSkillDtoSchema.partial();
export type UpdateSkillDto = z.infer<typeof UpdateSkillDtoSchema>;

export const CreateExperienceDtoSchema = ExperienceSchema.omit({ id: true });
export type CreateExperienceDto = z.infer<typeof CreateExperienceDtoSchema>;
export const UpdateExperienceDtoSchema = CreateExperienceDtoSchema.partial();
export type UpdateExperienceDto = z.infer<typeof UpdateExperienceDtoSchema>;

export const CreateProjectDtoSchema = ProjectSchema.omit({ id: true });
export type CreateProjectDto = z.infer<typeof CreateProjectDtoSchema>;
export const UpdateProjectDtoSchema = CreateProjectDtoSchema.partial();
export type UpdateProjectDto = z.infer<typeof UpdateProjectDtoSchema>;

export const CreateEducationDtoSchema = EducationSchema.omit({ id: true });
export type CreateEducationDto = z.infer<typeof CreateEducationDtoSchema>;
export const UpdateEducationDtoSchema = CreateEducationDtoSchema.partial();
export type UpdateEducationDto = z.infer<typeof UpdateEducationDtoSchema>;

export const CreateCertificationDtoSchema = CertificationSchema.omit({ id: true });
export type CreateCertificationDto = z.infer<typeof CreateCertificationDtoSchema>;
export const UpdateCertificationDtoSchema = CreateCertificationDtoSchema.partial();
export type UpdateCertificationDto = z.infer<typeof UpdateCertificationDtoSchema>;

export const ParseResumeRequestSchema = z.object({
  rawText: z.string().min(20, 'Resume text must be at least 20 characters'),
});
export type ParseResumeRequest = z.infer<typeof ParseResumeRequestSchema>;

export const ParsedResumeDataSchema = z.object({
  personal: CandidatePersonalSchema.partial(),
  experiences: z.array(CreateExperienceDtoSchema).default([]),
  educations: z.array(CreateEducationDtoSchema).default([]),
  skills: z.array(CreateSkillDtoSchema).default([]),
  projects: z.array(CreateProjectDtoSchema).default([]),
  certifications: z.array(CreateCertificationDtoSchema).default([]),
  meta: z.object({
    detectedSections: z.array(z.string()).default([]),
    characterCount: z.number().default(0),
    parsingTimeMs: z.number().default(0),
  }),
});
export type ParsedResumeData = z.infer<typeof ParsedResumeDataSchema>;

export const BatchImportProfileRequestSchema = z.object({
  mode: z.enum(['merge', 'replace']).default('merge'),
  data: ParsedResumeDataSchema,
});
export type BatchImportProfileRequest = z.infer<typeof BatchImportProfileRequestSchema>;
