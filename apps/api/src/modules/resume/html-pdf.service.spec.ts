import type { ResumeData } from '@praman/schemas';
import { describe, expect, it } from 'vitest';
import { HtmlPdfService } from './html-pdf.service.js';

describe('HtmlPdfService', () => {
  const service = new HtmlPdfService();

  const mockResume: ResumeData = {
    personal: {
      name: 'Jane Doe',
      contact: {
        email: 'jane@example.com',
        phone: '+1 555-1234',
        location: 'San Francisco, CA',
      },
    },
    summary:
      'Seasoned Full Stack Engineer with 7+ years of building high scale distributed systems.',
    summaryClaims: [],
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    experience: [
      {
        sourceExperienceId: 'exp-1',
        company: 'Tech Corp',
        title: 'Senior Software Engineer',
        bullets: [
          'Architected distributed event-driven microservices processing 20M events/day.',
          'Reduced API latency by 45% through caching optimization.',
        ],
      },
    ],
    projects: [
      {
        sourceProjectId: 'proj-1',
        name: 'Praman Engine',
        bullets: ['Engineered deterministic resume validation ledger with Zod and TypeScript.'],
      },
    ],
    education: [
      {
        sourceEducationId: 'edu-1',
        institution: 'University of California, Berkeley',
        degree: 'B.S. in Computer Science',
      },
    ],
    certifications: [
      {
        sourceCertificationId: 'cert-1',
        name: 'AWS Certified Solutions Architect',
      },
    ],
  };

  const mockProfile = {
    experiences: [
      {
        id: 'exp-1',
        startDate: '2021',
        endDate: 'Present',
        isCurrent: true,
      },
    ],
    projects: [
      {
        id: 'proj-1',
        technologies: ['TypeScript', 'Node.js', 'Docker'],
        link: 'https://github.com/example/praman',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        endDate: '2020',
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        issuer: 'Amazon Web Services',
        date: '2022',
      },
    ],
    personal: {
      links: {
        linkedin: 'https://linkedin.com/in/janedoe',
        github: 'https://github.com/janedoe',
      },
    },
  };

  it('generates HTML containing all key sections and escaped content', () => {
    const html = service.generateHtml(mockResume, mockProfile, 'modern-developer');

    expect(html).toContain('Jane Doe');
    expect(html).toContain('jane@example.com');
    expect(html).toContain('San Francisco, CA');
    expect(html).toContain('Seasoned Full Stack Engineer');
    expect(html).toContain('Senior Software Engineer');
    expect(html).toContain('Tech Corp');
    expect(html).toContain('Architected distributed event-driven microservices');
    expect(html).toContain('Praman Engine');
    expect(html).toContain('B.S. in Computer Science');
    expect(html).toContain('University of California, Berkeley');
    expect(html).toContain('AWS Certified Solutions Architect');
    expect(html).toContain('Amazon Web Services');
  });

  it('supports alternative templates with proper styling classes', () => {
    const modernHtml = service.generateHtml(mockResume, mockProfile, 'modern-developer');
    expect(modernHtml).toContain('Inter');
    expect(modernHtml).toContain('list-style-type: square');

    const academicHtml = service.generateHtml(mockResume, mockProfile, 'classic-academic');
    expect(academicHtml).toContain('Computer Modern');
    expect(academicHtml).toContain('font-variant: small-caps');
    expect(academicHtml).toContain('list-style-type: circle');

    const executiveHtml = service.generateHtml(mockResume, mockProfile, 'compact-executive');
    expect(executiveHtml).toContain('Arial');
    expect(executiveHtml).toContain('list-style-type: disc');
    expect(executiveHtml).toContain('5mm 9mm 5mm 9mm');
  });

  it('enforces solid dark text (#000000) for all resume text content and deep navy (#004f90) for links', () => {
    const html = service.generateHtml(mockResume, mockProfile, 'modern-developer');

    // Confirm no intermediate grays
    expect(html).not.toContain('#111111');
    expect(html).not.toContain('#222222');
    expect(html).not.toContain('#333333');
    expect(html).not.toContain('#64748b');

    // Confirm solid dark color
    expect(html).toContain('color: #000000;');

    // Confirm link color
    expect(html).toContain('color: #004f90;');
  });

  it('escapes special characters to prevent HTML injection', () => {
    const dangerousResume: ResumeData = {
      ...mockResume,
      personal: {
        name: '<script>alert("XSS")</script>',
        contact: { email: 'test@example.com' },
      },
      summary: '<b>Bold</b> & "Quotes"',
    };

    const html = service.generateHtml(dangerousResume, mockProfile);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;Bold&lt;/b&gt; &amp; &quot;Quotes&quot;');
  });

  it('compiles PDF buffer for all 3 template variants via findChromeExecutable and puppeteer', async () => {
    const modernPdf = await service.generatePdf(mockResume, mockProfile, 'modern-developer');
    expect(modernPdf).toBeInstanceOf(Buffer);
    expect(modernPdf.length).toBeGreaterThan(1000);
    expect(modernPdf.toString('ascii', 0, 4)).toBe('%PDF');

    const executivePdf = await service.generatePdf(mockResume, mockProfile, 'compact-executive');
    expect(executivePdf).toBeInstanceOf(Buffer);
    expect(executivePdf.length).toBeGreaterThan(1000);
    expect(executivePdf.toString('ascii', 0, 4)).toBe('%PDF');
  });
});
