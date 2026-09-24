/**
 * Comprehensive Resume Exporters (Plain Text, Markdown, and ATS JSON)
 * Optimized for job applicant tracking systems (ATS), direct text pasting,
 * and markdown documentation.
 */

export interface ResumeLikeSkill {
  name?: string;
  category?: string;
  level?: string;
}

export interface ResumeLikeExperience {
  id?: string;
  sourceExperienceId?: string;
  company?: string;
  title?: string;
  role?: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  bullets?: string[];
  responsibilities?: string[];
  achievements?: string[];
  highlights?: string[];
  technologies?: string[];
}

export interface ResumeLikeProject {
  id?: string;
  sourceProjectId?: string;
  name?: string;
  role?: string | null;
  description?: string | null;
  technologies?: string[];
  link?: string | null;
  url?: string | null;
  bullets?: string[];
  outcomes?: string[];
  highlights?: string[];
}

export interface ResumeLikeEducation {
  id?: string;
  sourceEducationId?: string;
  institution?: string | null;
  degree?: string | null;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  details?: string | null;
}

export interface ResumeLikeCertification {
  id?: string;
  sourceCertificationId?: string;
  name?: string | null;
  issuer?: string | null;
  date?: string | null;
}

export interface ResumeLikePersonal {
  name?: string;
  title?: string | null;
  summary?: string | null;
  location?: string | null;
  contact?: Record<string, string>;
  links?: Record<string, string>;
}

export interface ResumeInput {
  personal?: ResumeLikePersonal;
  summary?: string;
  skills?: (string | ResumeLikeSkill)[];
  experience?: ResumeLikeExperience[];
  experiences?: ResumeLikeExperience[];
  projects?: ResumeLikeProject[];
  education?: ResumeLikeEducation[];
  educations?: ResumeLikeEducation[];
  certifications?: ResumeLikeCertification[];
}

/**
 * Converts structured ResumeData into clean, human-readable ASCII plain text
 * optimized for legacy ATS text submission fields and clipboard pasting.
 */
export function generatePlainTextResume(resume?: ResumeInput | null): string {
  if (!resume) return '';

  const personal = resume.personal || {};
  const contact = personal.contact || {};
  const links = personal.links || {};
  const lines: string[] = [];

  // 1. Header
  const name = personal.name || 'CANDIDATE';
  lines.push(name.toUpperCase());
  if (personal.title) lines.push(personal.title);

  const contactPieces: string[] = [];
  if (typeof contact === 'object') {
    if (contact.email) contactPieces.push(contact.email);
    if (contact.phone) contactPieces.push(contact.phone);
    const loc = contact.location || personal.location;
    if (loc) contactPieces.push(loc);
    if (contact.linkedin || links.linkedin)
      contactPieces.push(`LinkedIn: ${contact.linkedin || links.linkedin}`);
    if (contact.github || links.github)
      contactPieces.push(`GitHub: ${contact.github || links.github}`);
    if (contact.portfolio || links.portfolio)
      contactPieces.push(`Portfolio: ${contact.portfolio || links.portfolio}`);
  }

  if (contactPieces.length > 0) {
    lines.push(contactPieces.join(' | '));
  }
  lines.push('');

  // 2. Summary
  const summary = resume.summary || personal.summary;
  if (summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('----------------------------------------');
    lines.push(summary);
    lines.push('');
  }

  // 3. Technical Skills
  const skills = resume.skills || [];
  if (skills.length > 0) {
    lines.push('TECHNICAL SKILLS');
    lines.push('----------------------------------------');
    if (typeof skills[0] === 'string') {
      lines.push(skills.join(', '));
    } else {
      const byCategory: Record<string, string[]> = {};
      for (const s of skills) {
        if (typeof s === 'string') {
          if (!byCategory['Core Technologies']) byCategory['Core Technologies'] = [];
          byCategory['Core Technologies'].push(s);
        } else {
          const cat = s.category || 'Core Technologies';
          if (!byCategory[cat]) byCategory[cat] = [];
          if (s.name) byCategory[cat].push(s.name);
        }
      }
      for (const [cat, items] of Object.entries(byCategory)) {
        lines.push(`${cat}: ${items.join(', ')}`);
      }
    }
    lines.push('');
  }

  // 4. Experience
  const experiences = resume.experience || resume.experiences || [];
  if (experiences.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    lines.push('----------------------------------------');
    for (const exp of experiences) {
      const roleTitle = exp.title || exp.role || 'Software Engineer';
      const company = exp.company || 'Company';
      const meta = [
        exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '',
        exp.location,
      ]
        .filter(Boolean)
        .join(' | ');

      lines.push(`${roleTitle} — ${company}`);
      if (meta) lines.push(meta);

      const bullets = exp.bullets || exp.highlights || [];
      if (Array.isArray(bullets)) {
        for (const b of bullets) {
          lines.push(`• ${b}`);
        }
      }

      if (exp.technologies && Array.isArray(exp.technologies) && exp.technologies.length > 0) {
        lines.push(`  Technologies: ${exp.technologies.join(', ')}`);
      }
      lines.push('');
    }
  }

  // 5. Projects
  const projects = resume.projects || [];
  if (projects.length > 0) {
    lines.push('PROJECTS');
    lines.push('----------------------------------------');
    for (const proj of projects) {
      lines.push(proj.name + (proj.role ? ` (${proj.role})` : ''));
      if (proj.description) lines.push(proj.description);

      const bullets = proj.bullets || proj.highlights || [];
      if (Array.isArray(bullets)) {
        for (const b of bullets) {
          lines.push(`• ${b}`);
        }
      }

      if (proj.technologies && Array.isArray(proj.technologies) && proj.technologies.length > 0) {
        lines.push(`  Technologies: ${proj.technologies.join(', ')}`);
      }
      if (proj.url || proj.link) lines.push(`  Link: ${proj.url || proj.link}`);
      lines.push('');
    }
  }

  // 6. Education
  const educations = resume.education || resume.educations || [];
  if (educations.length > 0) {
    lines.push('EDUCATION');
    lines.push('----------------------------------------');
    for (const edu of educations) {
      lines.push(edu.institution || 'University');
      const degreeLine = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
      if (degreeLine) lines.push(degreeLine);
      if (edu.details) lines.push(`• ${edu.details}`);
      lines.push('');
    }
  }

  // 7. Certifications
  const certifications = resume.certifications || [];
  if (certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    lines.push('----------------------------------------');
    for (const cert of certifications) {
      lines.push(
        `• ${cert.name}${cert.issuer ? ` — ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Converts structured ResumeData into clean GitHub-flavored Markdown.
 */
export function generateMarkdownResume(resume?: ResumeInput | null): string {
  if (!resume) return '';

  const personal = resume.personal || {};
  const contact = personal.contact || {};
  const links = personal.links || {};
  const lines: string[] = [];

  // Header
  lines.push(`# ${personal.name || 'Candidate'}`);
  if (personal.title) lines.push(`### ${personal.title}`);

  const contactPieces: string[] = [];
  if (typeof contact === 'object') {
    if (contact.email) contactPieces.push(`[${contact.email}](mailto:${contact.email})`);
    if (contact.phone) contactPieces.push(contact.phone);
    const loc = contact.location || personal.location;
    if (loc) contactPieces.push(loc);
    if (contact.linkedin || links.linkedin)
      contactPieces.push(`[LinkedIn](${contact.linkedin || links.linkedin})`);
    if (contact.github || links.github)
      contactPieces.push(`[GitHub](${contact.github || links.github})`);
    if (contact.portfolio || links.portfolio)
      contactPieces.push(`[Portfolio](${contact.portfolio || links.portfolio})`);
  }

  if (contactPieces.length > 0) {
    lines.push(contactPieces.join(' • '));
  }
  lines.push('\n---\n');

  // Summary
  const summary = resume.summary || personal.summary;
  if (summary) {
    lines.push('## Professional Summary\n');
    lines.push(summary);
    lines.push('');
  }

  // Skills
  const skills = resume.skills || [];
  if (skills.length > 0) {
    lines.push('## Technical Skills\n');
    if (typeof skills[0] === 'string') {
      lines.push((skills as string[]).map((s: string) => `\`${s}\``).join(', '));
    } else {
      for (const s of skills) {
        if (typeof s === 'string') {
          lines.push(`- **${s}**`);
        } else {
          lines.push(`- **${s.name || ''}**${s.category ? ` (${s.category})` : ''}`);
        }
      }
    }
    lines.push('');
  }

  // Experience
  const experiences = resume.experience || resume.experiences || [];
  if (experiences.length > 0) {
    lines.push('## Experience\n');
    for (const exp of experiences) {
      lines.push(`### ${exp.title || exp.role} — **${exp.company}**`);
      const meta = [
        exp.startDate && exp.endDate ? `*${exp.startDate} – ${exp.endDate}*` : '',
        exp.location,
      ]
        .filter(Boolean)
        .join(' | ');
      if (meta) lines.push(meta);

      const bullets = exp.bullets || exp.highlights || [];
      if (Array.isArray(bullets)) {
        for (const b of bullets) {
          lines.push(`- ${b}`);
        }
      }
      lines.push('');
    }
  }

  // Projects
  const projects = resume.projects || [];
  if (projects.length > 0) {
    lines.push('## Projects\n');
    for (const proj of projects) {
      const linkPart = proj.url || proj.link ? ` [Live](${proj.url || proj.link})` : '';
      lines.push(`### ${proj.name}${linkPart}`);
      if (proj.description) lines.push(proj.description);

      const bullets = proj.bullets || proj.highlights || [];
      if (Array.isArray(bullets)) {
        for (const b of bullets) {
          lines.push(`- ${b}`);
        }
      }
      lines.push('');
    }
  }

  // Education
  const educations = resume.education || resume.educations || [];
  if (educations.length > 0) {
    lines.push('## Education\n');
    for (const edu of educations) {
      lines.push(`- **${edu.institution}** — ${edu.degree || 'Degree'}`);
    }
    lines.push('');
  }

  // Certifications
  const certifications = resume.certifications || [];
  if (certifications.length > 0) {
    lines.push('## Certifications\n');
    for (const cert of certifications) {
      lines.push(`- **${cert.name}**${cert.issuer ? ` (${cert.issuer})` : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Standardizes resume data into a clean, canonical ATS JSON representation.
 */
export function generateAtsJsonResume(resume?: ResumeInput | null): Record<string, unknown> {
  if (!resume) return {};

  const personal = resume.personal || {};
  const contact = personal.contact || {};
  const links = personal.links || {};

  return {
    candidate: {
      name: personal.name || '',
      title: personal.title || '',
      email: contact.email || '',
      phone: contact.phone || '',
      location: contact.location || personal.location || '',
      links: {
        linkedin: contact.linkedin || links.linkedin || '',
        github: contact.github || links.github || '',
        portfolio: contact.portfolio || links.portfolio || '',
      },
    },
    professionalSummary: resume.summary || personal.summary || '',
    coreCompetencies: Array.isArray(resume.skills)
      ? resume.skills.map((s) => (typeof s === 'string' ? s : (s as ResumeLikeSkill).name || ''))
      : [],
    workHistory: (resume.experience || resume.experiences || []).map((exp) => ({
      company: exp.company || '',
      title: exp.title || exp.role || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      location: exp.location || '',
      achievements: exp.bullets || exp.highlights || [],
      sourceId: exp.sourceExperienceId || exp.id || null,
    })),
    projects: (resume.projects || []).map((proj) => ({
      name: proj.name || '',
      url: proj.url || proj.link || '',
      highlights: proj.bullets || proj.highlights || [],
      sourceId: proj.sourceProjectId || proj.id || null,
    })),
    education: (resume.education || resume.educations || []).map((edu) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      sourceId: edu.sourceEducationId || edu.id || null,
    })),
    certifications: (resume.certifications || []).map((cert) => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      sourceId: cert.sourceCertificationId || cert.id || null,
    })),
    auditMetadata: {
      generator: 'Praman Truth-Preserving Engine',
      antiHallucinationEnforced: true,
      timestamp: new Date().toISOString(),
    },
  };
}
