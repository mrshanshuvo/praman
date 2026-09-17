import { describe, expect, it } from 'vitest';
import { CoverLetterSchema, RecruiterEmailSchema } from '../src/outreach.js';

describe('Outreach Schemas (Cover Letter & Recruiter Email)', () => {
  describe('CoverLetterSchema', () => {
    it('validates a complete cover letter structure', () => {
      const valid = {
        recipientName: 'Engineering Hiring Team',
        companyName: 'Softvence Agency',
        jobTitle: 'Full-Stack Developer',
        opening:
          'I am writing to express my strong interest in the Full-Stack Developer position at Softvence Agency.',
        bodyParagraphs: [
          'In my recent experience, I refactored real-time API endpoints using NestJS and PostgreSQL, reducing latency by 35%.',
          'At CareCamp, I architected the core payments and medical ledger infrastructure handling authenticated user workflows.',
        ],
        closing:
          'I would welcome the opportunity to discuss how my verified background aligns with your engineering goals.',
        signOff: 'Sincerely,',
        senderName: 'Shahid Hasan Shuvo',
        senderContact: {
          email: 'mrshanshuvo@gmail.com',
          phone: '+8801929346733',
        },
      };

      const parsed = CoverLetterSchema.parse(valid);
      expect(parsed.companyName).toBe('Softvence Agency');
      expect(parsed.bodyParagraphs).toHaveLength(2);
      expect(parsed.recipientName).toBe('Engineering Hiring Team');
    });

    it('applies defaults for recipientName and signOff', () => {
      const minimal = {
        companyName: 'Acme Corp',
        jobTitle: 'Software Engineer',
        opening: 'Excited to apply.',
        bodyParagraphs: ['Built high-throughput systems.'],
        closing: 'Looking forward to connecting.',
        senderName: 'Candidate',
      };

      const parsed = CoverLetterSchema.parse(minimal);
      expect(parsed.recipientName).toBe('Hiring Team');
      expect(parsed.signOff).toBe('Sincerely,');
    });

    it('rejects cover letter without required fields', () => {
      expect(() => CoverLetterSchema.parse({})).toThrow();
      expect(() =>
        CoverLetterSchema.parse({
          companyName: 'Acme',
          bodyParagraphs: [], // min 1 required
        }),
      ).toThrow();
    });
  });

  describe('RecruiterEmailSchema', () => {
    it('validates a targeted recruiter cold email', () => {
      const valid = {
        subject: 'Application: Full-Stack Developer — Shahid Hasan Shuvo',
        salutation: 'Hi Alex,',
        hook: 'I noticed your opening for a Full-Stack Developer at Softvence Agency and wanted to reach out directly.',
        highlights: [
          'Production experience with NestJS, Next.js, and PostgreSQL indexing.',
          'Reduced API latency by 35% on mission-critical client services.',
        ],
        callToAction: 'Would you be open to a brief 10-minute chat this Thursday or Friday?',
        signOff: 'Best regards,',
        senderName: 'Shahid Hasan Shuvo',
      };

      const parsed = RecruiterEmailSchema.parse(valid);
      expect(parsed.subject).toContain('Full-Stack Developer');
      expect(parsed.highlights).toHaveLength(2);
    });

    it('rejects email with empty highlights', () => {
      expect(() =>
        RecruiterEmailSchema.parse({
          subject: 'Role',
          hook: 'Hello',
          highlights: [],
          callToAction: 'Chat?',
          senderName: 'Me',
        }),
      ).toThrow();
    });
  });
});
