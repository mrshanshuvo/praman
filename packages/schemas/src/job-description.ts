import { z } from 'zod';

export const StructuredJdSchema = z.object({
  jobTitle: z.string().describe('The primary title of the job opening'),
  seniority: z
    .string()
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
    .optional()
    .describe('Expected years of experience or range if specified'),
  responsibilities: z
    .array(z.string())
    .default([])
    .describe('Key day-to-day responsibilities and tasks'),
  educationRequirements: z
    .array(z.string())
    .optional()
    .describe('Degrees or education criteria if stated'),
  locationOrWorkMode: z
    .string()
    .optional()
    .describe('Remote, Hybrid, On-site, or specific city/country'),
  salary: z.string().optional().describe('Compensation range or notes if listed'),
  mustHave: z
    .array(z.string())
    .default([])
    .describe('Hard prerequisites that candidates must possess'),
  niceToHave: z.array(z.string()).default([]).describe('Bonus qualifications or differentiators'),
  otherNotes: z
    .array(z.string())
    .optional()
    .describe('Cultural or operational notes, perks, or constraints'),
});
export type StructuredJd = z.infer<typeof StructuredJdSchema>;

export const CreateJobDescriptionDtoSchema = z.object({
  rawText: z.string().min(10, 'Job description must be at least 10 characters long'),
});
export type CreateJobDescriptionDto = z.infer<typeof CreateJobDescriptionDtoSchema>;
