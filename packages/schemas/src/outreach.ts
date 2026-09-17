import { z } from 'zod';

export const CoverLetterSchema = z.object({
  recipientName: z.string().default('Hiring Team'),
  companyName: z.string().describe('Target employer name extracted from JD'),
  jobTitle: z.string().describe('Target job title extracted from JD'),
  opening: z
    .string()
    .describe('Mission hook and clear statement of enthusiasm and target position'),
  bodyParagraphs: z
    .array(z.string())
    .min(1)
    .describe(
      'Evidence-backed paragraphs connecting verified candidate achievements directly to key JD requirements',
    ),
  closing: z
    .string()
    .describe('Professional sign-off, polite wrap-up, and clear call-to-action for an interview'),
  signOff: z.string().default('Sincerely,'),
  senderName: z.string(),
  senderContact: z.record(z.string()).default({}),
});
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

export const RecruiterEmailSchema = z.object({
  subject: z
    .string()
    .describe('High-open-rate subject line referencing target role and key differentiator'),
  salutation: z.string().default('Hi [Name] / Hiring Team,'),
  hook: z.string().describe('1-sentence value proposition connecting background to the role'),
  highlights: z
    .array(z.string())
    .min(1)
    .describe('2-3 bullet highlights from verified experience/projects directly matching the JD'),
  callToAction: z
    .string()
    .describe('Low-friction ask for a brief 10-15 minute introductory conversation'),
  signOff: z.string().default('Best regards,'),
  senderName: z.string(),
});
export type RecruiterEmail = z.infer<typeof RecruiterEmailSchema>;
