import { describe, expect, it } from 'vitest';
import { ResumeParserService } from './resume-parser.service.js';

describe('ResumeParserService', () => {
  const parser = new ResumeParserService();

  it('correctly parses contact information from resume header', () => {
    const resumeText = `
# Alex Mercer
Senior Full-Stack Engineer
San Francisco, CA | alex.mercer@example.com | (555) 234-5678
https://github.com/alexmercer | https://linkedin.com/in/alex-mercer

## Professional Summary
Passionate software architect with 8+ years building enterprise SaaS platforms.
`;

    const result = parser.parse(resumeText);

    expect(result.personal.name).toBe('Alex Mercer');
    expect(result.personal.title).toBe('Senior Full-Stack Engineer');
    expect(result.personal.contact?.email).toBe('alex.mercer@example.com');
    expect(result.personal.contact?.phone).toBe('(555) 234-5678');
    expect(result.personal.links?.github).toBe('https://github.com/alexmercer');
    expect(result.personal.links?.linkedin).toBe('https://linkedin.com/in/alex-mercer');
    expect(result.personal.summary).toContain('Passionate software architect');
  });

  it('correctly parses work experiences with dates and bullets', () => {
    const resumeText = `
Alex Mercer
alex@example.com

EXPERIENCE

Acme Corporation - Senior Software Engineer
Jan 2021 - Present
• Architected event-driven microservices processing 10M daily transactions
• Reduced database query latency by 45% using Redis caching and index optimization
• Mentored 5 junior engineers and led code reviews
Stack: TypeScript, Node.js, PostgreSQL, Redis, Docker

Beta Solutions, Full Stack Developer
03/2018 – 12/2020
• Built responsive dashboard using React and TailwindCSS
• Integrated Stripe payments and webhook infrastructure
Technologies: React, GraphQL, Node.js
`;

    const result = parser.parse(resumeText);

    expect(result.experiences.length).toBe(2);

    const exp1 = result.experiences[0];
    expect(exp1.isCurrent).toBe(true);
    expect(exp1.responsibilities.length).toBeGreaterThanOrEqual(2);
    expect(exp1.responsibilities[0]).toContain('Architected event-driven microservices');
    expect(exp1.technologies).toContain('TypeScript');
    expect(exp1.technologies).toContain('PostgreSQL');

    const exp2 = result.experiences[1];
    expect(exp2.isCurrent).toBe(false);
    expect(exp2.technologies).toContain('React');
  });

  it('correctly parses technical skills into structured tags', () => {
    const resumeText = `
Alex Mercer
alex@example.com

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Python, Go, SQL
Frameworks: React, Next.js, NestJS, Express, FastAPI
Databases & Cloud: PostgreSQL, Redis, MongoDB, AWS, Docker, Kubernetes
`;

    const result = parser.parse(resumeText);

    expect(result.skills.length).toBeGreaterThanOrEqual(10);
    const skillNames = result.skills.map((s) => s.name);
    expect(skillNames).toContain('TypeScript');
    expect(skillNames).toContain('Next.js');
    expect(skillNames).toContain('NestJS');
    expect(skillNames).toContain('PostgreSQL');
    expect(skillNames).toContain('Docker');
  });

  it('correctly parses education and certifications', () => {
    const resumeText = `
Alex Mercer
alex@example.com

EDUCATION
University of California, Berkeley
Bachelor of Science in Computer Science
2014 - 2018

CERTIFICATIONS
AWS Certified Solutions Architect - Associate (2022)
Google Cloud Professional Cloud Architect
`;

    const result = parser.parse(resumeText);

    expect(result.educations.length).toBe(1);
    expect(result.educations[0].institution).toContain('Berkeley');
    expect(result.educations[0].degree).toContain('Bachelor');

    expect(result.certifications.length).toBe(2);
    expect(result.certifications[0].issuer).toBe('AWS');
  });
});
