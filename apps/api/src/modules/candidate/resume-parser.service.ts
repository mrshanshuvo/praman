import { Injectable } from '@nestjs/common';
import type {
  CreateCertificationDto,
  CreateEducationDto,
  CreateExperienceDto,
  CreateProjectDto,
  CreateSkillDto,
  ParsedResumeData,
} from '@praman/schemas';

interface SectionBlock {
  type:
    | 'EXPERIENCE'
    | 'EDUCATION'
    | 'SKILLS'
    | 'PROJECTS'
    | 'CERTIFICATIONS'
    | 'SUMMARY'
    | 'HEADER';
  title: string;
  content: string;
}

const SECTION_HEADERS: { type: SectionBlock['type']; regex: RegExp }[] = [
  {
    type: 'EXPERIENCE',
    regex:
      /^(?:(?:WORK|PROFESSIONAL|RELEVANT|EMPLOYMENT)\s+EXPERIENCE|WORK\s+HISTORY|EMPLOYMENT\s+HISTORY|EXPERIENCE)\b/im,
  },
  {
    type: 'EDUCATION',
    regex:
      /^(?:EDUCATION|ACADEMIC\s+BACKGROUND|ACADEMIC\s+HISTORY|ACADEMICS|QUALIFICATIONS|EDUCATION\s+AND\s+TRAINING)\b/im,
  },
  {
    type: 'SKILLS',
    regex:
      /^(?:TECHNICAL\s+SKILLS|CORE\s+COMPETENCIES|AREAS\s+OF\s+EXPERTISE|SKILLS\s+AND\s+TECHNOLOGIES|SKILLS|TECHNOLOGIES|STACK)\b/im,
  },
  {
    type: 'PROJECTS',
    regex:
      /^(?:PERSONAL\s+PROJECTS|KEY\s+PROJECTS|ACADEMIC\s+PROJECTS|OPEN\s+SOURCE\s+PROJECTS|PROJECTS|SELECTED\s+PROJECTS)\b/im,
  },
  {
    type: 'CERTIFICATIONS',
    regex:
      /^(?:CERTIFICATIONS\s+AND\s+LICENSES|CERTIFICATIONS|CERTIFICATES|LICENSES|CREDENTIALS)\b/im,
  },
  {
    type: 'SUMMARY',
    regex:
      /^(?:PROFESSIONAL\s+SUMMARY|EXECUTIVE\s+SUMMARY|SUMMARY\s+OF\s+QUALIFICATIONS|SUMMARY|PROFILE|ABOUT\s+ME|OBJECTIVE)\b/im,
  },
];

const MONTH_NAMES =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const SINGLE_DATE_PART = `(?:(?:${MONTH_NAMES}\\s+\\d{2,4})|\\d{1,2}\\/\\d{2,4}|\\d{4}|${MONTH_NAMES})`;
const END_DATE_PART = `(?:Present|Current|Now|Ongoing|${SINGLE_DATE_PART})`;

const DATE_RANGE_REGEX = new RegExp(
  `(${SINGLE_DATE_PART}\\s*(?:-|–|—|to)\\s*${END_DATE_PART})`,
  'i',
);

@Injectable()
export class ResumeParserService {
  /**
   * Deterministically parses resume text into strongly typed Praman candidate profile structures.
   * 100% offline, zero external API or paid AI dependencies.
   */
  parse(rawText: string): ParsedResumeData {
    const startTime = performance.now();
    const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const sections = this.segmentSections(cleanText);
    const detectedSections = sections.map((s) => s.type);

    // 1. Personal Information (extracted from header block and summary)
    const headerSection = sections.find((s) => s.type === 'HEADER')?.content || '';
    const summarySection = sections.find((s) => s.type === 'SUMMARY')?.content || '';
    const personal = this.extractPersonal(cleanText, headerSection, summarySection);

    // 2. Work Experiences
    const expSection = sections.find((s) => s.type === 'EXPERIENCE')?.content || '';
    const experiences = this.parseExperiences(expSection);

    // 3. Education
    const eduSection = sections.find((s) => s.type === 'EDUCATION')?.content || '';
    const educations = this.parseEducation(eduSection);

    // 4. Skills
    const skillSection = sections.find((s) => s.type === 'SKILLS')?.content || '';
    const skills = this.parseSkills(skillSection);

    // 5. Projects
    const projSection = sections.find((s) => s.type === 'PROJECTS')?.content || '';
    const projects = this.parseProjects(projSection);

    // 6. Certifications
    const certSection = sections.find((s) => s.type === 'CERTIFICATIONS')?.content || '';
    const certifications = this.parseCertifications(certSection);

    const parsingTimeMs = Math.round(performance.now() - startTime);

    return {
      personal,
      experiences,
      educations,
      skills,
      projects,
      certifications,
      meta: {
        detectedSections,
        characterCount: rawText.length,
        parsingTimeMs,
      },
    };
  }

  private segmentSections(text: string): SectionBlock[] {
    const lines = text.split('\n');
    const sections: SectionBlock[] = [];

    let currentType: SectionBlock['type'] = 'HEADER';
    let currentTitle = 'HEADER';
    let currentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        currentLines.push('');
        continue;
      }

      // If line contains a colon followed by content, it's an inline key-value pair (e.g. "Technologies: React, Node.js"), not a section header!
      if (line.includes(':') && line.split(':')[1].trim().length > 0) {
        currentLines.push(lines[i]);
        continue;
      }

      // Check if this line looks like a section header (clean, short, matching keyword)
      // Usually headers are under 50 characters and not sentences
      const cleanHeaderCandidate = line.replace(/^[#*_\s]+|[#*_\s:]+$/g, '').trim();
      let matchedType: SectionBlock['type'] | null = null;

      if (cleanHeaderCandidate.length <= 45 && !cleanHeaderCandidate.endsWith('.')) {
        for (const sec of SECTION_HEADERS) {
          if (sec.regex.test(cleanHeaderCandidate)) {
            matchedType = sec.type;
            break;
          }
        }
      }

      if (matchedType) {
        if (currentLines.length > 0) {
          sections.push({
            type: currentType,
            title: currentTitle,
            content: currentLines.join('\n').trim(),
          });
        }
        currentType = matchedType;
        currentTitle = cleanHeaderCandidate;
        currentLines = [];
      } else {
        currentLines.push(lines[i]);
      }
    }

    if (currentLines.length > 0) {
      sections.push({
        type: currentType,
        title: currentTitle,
        content: currentLines.join('\n').trim(),
      });
    }

    return sections;
  }

  private extractPersonal(fullText: string, headerText: string, summaryText: string) {
    const lines = headerText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => Boolean(l));

    // Name: Typically the first prominent line
    let name = 'Candidate Name';
    for (const l of lines) {
      const stripped = l.replace(/^[#*_\s]+|[#*_\s]+$/g, '').trim();
      // Skip if looks like email or link
      if (
        stripped.length > 2 &&
        !stripped.includes('@') &&
        !stripped.toLowerCase().startsWith('http') &&
        !stripped.match(/^\+?\d/)
      ) {
        name = stripped;
        break;
      }
    }

    // Professional title: Often 2nd line or found after name
    let title: string | null = null;
    const nameIndex = lines.findIndex((l) => l.includes(name));
    if (nameIndex >= 0 && lines[nameIndex + 1]) {
      const nextLine = lines[nameIndex + 1].replace(/^[#*_\s]+|[#*_\s]+$/g, '').trim();
      if (
        nextLine.length > 3 &&
        !nextLine.includes('@') &&
        !nextLine.toLowerCase().startsWith('http') &&
        !nextLine.match(/^\+?\d/) &&
        !nextLine.includes('|')
      ) {
        title = nextLine;
      }
    }

    // Email
    const emailMatch = fullText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : null;

    // Phone: Common international/US formats
    const phoneMatch = fullText.match(
      /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})/i,
    );
    const phone = phoneMatch ? phoneMatch[0].trim() : null;

    // Links: GitHub, LinkedIn, Portfolio
    const links: Record<string, string> = {};

    const githubMatch = fullText.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/[^\s)]*)?/i,
    );
    if (githubMatch) {
      links.github = githubMatch[0].startsWith('http')
        ? githubMatch[0]
        : `https://${githubMatch[0]}`;
    }

    const linkedinMatch = fullText.match(
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)(?:\/[^\s)]*)?/i,
    );
    if (linkedinMatch) {
      links.linkedin = linkedinMatch[0].startsWith('http')
        ? linkedinMatch[0]
        : `https://${linkedinMatch[0]}`;
    }

    // Location: Check for "City, State/Country" patterns in header
    let location: string | null = null;
    for (const l of lines.slice(0, 5)) {
      if (
        l.match(/[A-Za-z\s]+,\s*[A-Za-z\s]+/i) &&
        !l.includes('@') &&
        !l.toLowerCase().includes('github') &&
        !l.toLowerCase().includes('linkedin')
      ) {
        location = l.replace(/^[|•·\s]+|[|•·\s]+$/g, '').trim();
        break;
      }
    }

    const contact: Record<string, string> = {};
    if (email) contact.email = email;
    if (phone) contact.phone = phone;

    return {
      name,
      title: title || 'Full-Stack Developer',
      location: location || null,
      summary: summaryText.trim() || null,
      contact,
      links,
    };
  }

  private parseExperiences(text: string): CreateExperienceDto[] {
    if (!text.trim()) return [];
    const lines = text.split('\n');
    const experiences: CreateExperienceDto[] = [];

    interface RawJob {
      company: string;
      title: string;
      dateRange: string;
      lines: string[];
    }

    const jobBlocks: RawJob[] = [];
    let currentJob: RawJob | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const dateMatch = line.match(DATE_RANGE_REGEX);
      const isBullet = /^[•\-*▪–]\s+/.test(line) || /^\d+\.\s+/.test(line);

      // Line with a date range is usually a job entry header
      if (dateMatch && !isBullet) {
        if (currentJob) {
          jobBlocks.push(currentJob);
        }

        const dateRange = dateMatch[0].trim();
        let remaining = line
          .replace(dateRange, '')
          .replace(/[|•·\t–—-]+/g, ' ')
          .trim();

        // If the date was on its own line, check the previous line for Title / Company
        if (!remaining && i > 0 && lines[i - 1]?.trim()) {
          // If previous job had this line added to its lines, remove it
          if (
            currentJob &&
            currentJob.lines.length > 0 &&
            currentJob.lines[currentJob.lines.length - 1] === lines[i - 1].trim()
          ) {
            currentJob.lines.pop();
          }
          remaining = lines[i - 1].trim();
        }

        let company = 'Company';
        let title = 'Role';

        if (remaining.includes(',')) {
          const parts = remaining.split(',').map((p) => p.trim());
          company = parts[0] || 'Company';
          title = parts[1] || 'Role';
        } else if (remaining.includes(' - ')) {
          const parts = remaining.split(' - ').map((p) => p.trim());
          company = parts[0] || 'Company';
          title = parts[1] || 'Role';
        } else if (remaining) {
          title = remaining;
          if (i > 1 && lines[i - 2]?.trim() && !lines[i - 2].trim().match(DATE_RANGE_REGEX)) {
            company = lines[i - 2].trim();
          }
        }

        currentJob = {
          company,
          title,
          dateRange,
          lines: [],
        };
      } else if (currentJob) {
        currentJob.lines.push(line);
      } else if (!isBullet && i < 3 && line.length < 50) {
        // Potential leading company name before date line
        // will be caught by date line inspection
      }
    }

    if (currentJob) {
      jobBlocks.push(currentJob);
    }

    // Convert raw blocks to DTOs
    for (const block of jobBlocks) {
      const bullets: string[] = [];
      const technologies: string[] = [];

      for (const line of block.lines) {
        const isBullet = /^[•\-*▪–]\s+/.test(line) || /^\d+\.\s+/.test(line);
        const cleanLine = line.replace(/^[•\-*▪–\d.]+\s+/, '').trim();

        if (
          cleanLine.toLowerCase().startsWith('technologies:') ||
          cleanLine.toLowerCase().startsWith('stack:')
        ) {
          const techList = cleanLine
            .replace(/^(?:technologies|stack|tools):\s*/i, '')
            .split(/[,|;]/);
          for (const t of techList) {
            const trimmed = t.trim();
            if (trimmed) technologies.push(trimmed);
          }
        } else if (isBullet || cleanLine.length > 25) {
          bullets.push(cleanLine);
        }
      }

      const isCurrent = /present|current|now/i.test(block.dateRange);
      const dates = block.dateRange.split(/(?:-|–|—|to)/i).map((d) => d.trim());

      experiences.push({
        company: block.company,
        title: block.title,
        startDate: dates[0] || null,
        endDate: isCurrent ? null : dates[1] || null,
        isCurrent,
        responsibilities: bullets.slice(0, 8),
        technologies: [...new Set(technologies)],
        achievements: bullets.filter((b) =>
          /\d+%|\$\d+|\bimproved\b|\boptimized\b|\bled\b/i.test(b),
        ),
      });
    }

    return experiences;
  }

  private parseSkills(text: string): CreateSkillDto[] {
    if (!text.trim()) return [];
    const lines = text.split('\n');
    const skillNames = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Remove category prefixes (e.g. "Languages: JavaScript, TypeScript" -> "JavaScript, TypeScript")
      const cleanLine = trimmed.replace(/^[A-Za-z\s/&]+:\s*/, '');
      const tokens = cleanLine.split(/[,|•·;\t/]/);

      for (const token of tokens) {
        const cleaned = token.replace(/^[•\-*▪\s]+|[•\-*▪\s]+$/g, '').trim();
        // Sanity filter: Skill names are typically 1 to 30 characters
        if (
          cleaned.length >= 2 &&
          cleaned.length <= 32 &&
          !cleaned.includes('\n') &&
          !/^\d+$/.test(cleaned)
        ) {
          skillNames.add(cleaned);
        }
      }
    }

    return Array.from(skillNames).map((name) => ({
      name,
      level: 'EXPERIENCED',
      evidence: null,
    }));
  }

  private parseEducation(text: string): CreateEducationDto[] {
    if (!text.trim()) return [];
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const educations: CreateEducationDto[] = [];

    const DEGREE_REGEX =
      /\b(?:Bachelor|Master|Doctor|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.Sc|M\.Sc|B\.Tech|M\.Tech|Associate|Diploma)\b/i;
    const INSTITUTION_REGEX = /\b(?:University|College|Institute|School|Academy|Polytechnic)\b/i;

    let currentEdu: Partial<CreateEducationDto> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const hasDegree = DEGREE_REGEX.test(trimmed);
      const hasInstitution = INSTITUTION_REGEX.test(trimmed);
      const hasDate = DATE_RANGE_REGEX.test(trimmed) || /\b(19\d\d|20\d\d)\b/.test(trimmed);

      if (hasInstitution || hasDegree) {
        if (currentEdu?.institution && currentEdu?.degree) {
          educations.push({
            institution: currentEdu.institution,
            degree: currentEdu.degree,
            field: currentEdu.field || null,
            startDate: currentEdu.startDate || null,
            endDate: currentEdu.endDate || null,
            details: currentEdu.details || null,
          });
          currentEdu = null;
        }

        if (!currentEdu) {
          currentEdu = {};
        }

        if (hasInstitution && !currentEdu.institution) {
          currentEdu.institution = trimmed;
        } else if (hasDegree && !currentEdu.degree) {
          currentEdu.degree = trimmed;
        }
      }

      if (hasDate && currentEdu) {
        const yearMatches = trimmed.match(/\b(19\d\d|20\d\d)\b/g);
        if (yearMatches && yearMatches.length > 0) {
          currentEdu.endDate = yearMatches[yearMatches.length - 1];
          if (yearMatches.length > 1) {
            currentEdu.startDate = yearMatches[0];
          }
        }
      }
    }

    if (currentEdu?.institution && currentEdu?.degree) {
      educations.push({
        institution: currentEdu.institution,
        degree: currentEdu.degree,
        field: currentEdu.field || null,
        startDate: currentEdu.startDate || null,
        endDate: currentEdu.endDate || null,
        details: currentEdu.details || null,
      });
    }

    return educations;
  }

  private parseProjects(text: string): CreateProjectDto[] {
    if (!text.trim()) return [];
    const lines = text.split('\n');
    const projects: CreateProjectDto[] = [];

    let currentProject: (Partial<CreateProjectDto> & { bullets: string[] }) | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isBullet = /^[•\-*▪–]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
      const linkMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)]+/i);

      if (!isBullet && trimmed.length <= 60 && !trimmed.endsWith('.')) {
        if (currentProject?.name) {
          projects.push({
            name: currentProject.name,
            description: currentProject.bullets.join('. ') || 'Project description',
            technologies: currentProject.technologies || [],
            role: null,
            outcomes: currentProject.bullets.filter((b) =>
              /\d+%|\$|\bbuilt\b|\bcreated\b/i.test(b),
            ),
            link: currentProject.link || null,
          });
        }

        currentProject = {
          name: trimmed.replace(/^[#*_\s]+|[#*_\s:]+$/g, '').trim(),
          bullets: [],
          technologies: [],
        };

        if (linkMatch) {
          currentProject.link = linkMatch[0];
        }
      } else if (currentProject) {
        if (linkMatch && !currentProject.link) {
          currentProject.link = linkMatch[0];
        }
        currentProject.bullets.push(trimmed.replace(/^[•\-*▪–\d.]+\s+/, '').trim());
      }
    }

    if (currentProject?.name) {
      projects.push({
        name: currentProject.name,
        description: currentProject.bullets.join('. ') || 'Project description',
        technologies: currentProject.technologies || [],
        role: null,
        outcomes: currentProject.bullets.filter((b) => /\d+%|\$|\bbuilt\b|\bcreated\b/i.test(b)),
        link: currentProject.link || null,
      });
    }

    return projects;
  }

  private parseCertifications(text: string): CreateCertificationDto[] {
    if (!text.trim()) return [];
    const lines = text.split('\n');
    const certs: CreateCertificationDto[] = [];

    const ISSUERS = [
      'AWS',
      'Amazon',
      'Google',
      'Microsoft',
      'Meta',
      'Cisco',
      'CompTIA',
      'HashiCorp',
      'Oracle',
      'Coursera',
      'Udemy',
      'edX',
    ];

    for (const line of lines) {
      const trimmed = line
        .trim()
        .replace(/^[•\-*▪–\d.]+\s+/, '')
        .trim();
      if (!trimmed || trimmed.length < 3) continue;

      let issuer: string | null = null;
      for (const known of ISSUERS) {
        if (new RegExp(`\\b${known}\\b`, 'i').test(trimmed)) {
          issuer = known;
          break;
        }
      }

      const dateMatch = trimmed.match(/\b(19\d\d|20\d\d)\b/);
      const date = dateMatch ? dateMatch[0] : null;

      certs.push({
        name: trimmed,
        issuer: issuer || 'Authorized Issuer',
        date,
      });
    }

    return certs;
  }
}
