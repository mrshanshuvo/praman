/**
 * Converts structured ResumeData into clean, human-readable ASCII plain text
 * optimized for legacy ATS text submission fields and clipboard pasting.
 */

export function generatePlainTextResume(resume: any): string {
  if (!resume) return '';

  const personal = resume.personal || {};
  const contact = personal.contact || {};
  const links = personal.links || {};
  const lines: string[] = [];

  // Header
  if (personal.name) lines.push(personal.name.toUpperCase());
  if (personal.title) lines.push(personal.title);

  const contactPieces: string[] = [];
  if (contact.email) contactPieces.push(contact.email);
  if (contact.phone) contactPieces.push(contact.phone);
  if (personal.location) contactPieces.push(personal.location);
  if (links.github) contactPieces.push(`GitHub: ${links.github}`);
  if (links.linkedin) contactPieces.push(`LinkedIn: ${links.linkedin}`);
  if (links.portfolio) contactPieces.push(`Portfolio: ${links.portfolio}`);

  if (contactPieces.length > 0) {
    lines.push(contactPieces.join(' | '));
  }
  lines.push('');

  // Summary
  if (personal.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('----------------------------------------');
    lines.push(personal.summary);
    lines.push('');
  }

  // Experience
  const experiences = resume.experiences || [];
  if (experiences.length > 0) {
    lines.push('EXPERIENCE');
    lines.push('----------------------------------------');
    for (const exp of experiences) {
      const header = `${exp.company} — ${exp.role}`;
      const meta = [
        exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '',
        exp.location,
      ]
        .filter(Boolean)
        .join(' | ');

      lines.push(header);
      if (meta) lines.push(meta);

      if (exp.highlights && Array.isArray(exp.highlights)) {
        for (const h of exp.highlights) {
          lines.push(`• ${h}`);
        }
      }

      if (exp.technologies && Array.isArray(exp.technologies) && exp.technologies.length > 0) {
        lines.push(`  Technologies: ${exp.technologies.join(', ')}`);
      }
      lines.push('');
    }
  }

  // Projects
  const projects = resume.projects || [];
  if (projects.length > 0) {
    lines.push('PROJECTS');
    lines.push('----------------------------------------');
    for (const proj of projects) {
      lines.push(proj.name + (proj.role ? ` (${proj.role})` : ''));
      if (proj.description) lines.push(proj.description);

      if (proj.highlights && Array.isArray(proj.highlights)) {
        for (const h of proj.highlights) {
          lines.push(`• ${h}`);
        }
      }

      if (proj.technologies && Array.isArray(proj.technologies) && proj.technologies.length > 0) {
        lines.push(`  Technologies: ${proj.technologies.join(', ')}`);
      }
      if (proj.url) lines.push(`  Link: ${proj.url}`);
      lines.push('');
    }
  }

  // Skills
  const skills = resume.skills || [];
  if (skills.length > 0) {
    lines.push('TECHNICAL SKILLS');
    lines.push('----------------------------------------');
    // Group by category if available
    const byCategory: Record<string, string[]> = {};
    for (const s of skills) {
      const cat = s.category || 'General';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(s.name);
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      lines.push(`${cat}: ${items.join(', ')}`);
    }
    lines.push('');
  }

  // Education
  const educations = resume.education || resume.educations || [];
  if (educations.length > 0) {
    lines.push('EDUCATION');
    lines.push('----------------------------------------');
    for (const edu of educations) {
      lines.push(`${edu.institution}`);
      lines.push(
        `${edu.degree} in ${edu.field}${edu.startDate && edu.endDate ? ` (${edu.startDate} - ${edu.endDate})` : ''}`,
      );
      if (edu.details) lines.push(`• ${edu.details}`);
      lines.push('');
    }
  }

  // Certifications
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
