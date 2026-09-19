import { z } from 'zod';

export const StructuredJdSchema = z.object({
  jobTitle: z.string().describe('The primary title of the job opening'),
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

export interface CandidateJdAnalysisRecord {
  id: string;
  jobDescriptionId: string;
  result: any;
  matchScore?: number | null;
  matchLabel?: string | null;
  createdAt: string;
  updatedAt: string;
  strategy?: {
    id: string;
    candidateJdAnalysisId: string;
    result: any;
    resume?: any;
    resumes?: any[];
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
  createdAt: string;
  updatedAt: string;
  analysis?: CandidateJdAnalysisRecord | null;
}
