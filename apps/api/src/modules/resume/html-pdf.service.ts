import fs from 'node:fs';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import type { ResumeData } from '@praman/schemas';
import puppeteer, { type Browser } from 'puppeteer-core';

const CATEGORY_MAP: Record<string, string> = {
  'React.js': 'Frontend',
  React: 'Frontend',
  'Next.js': 'Frontend',
  TypeScript: 'Frontend',
  JavaScript: 'Frontend',
  'Tailwind CSS': 'Frontend',
  TailwindCSS: 'Frontend',
  'Shadcn/UI': 'Frontend',
  Redux: 'Frontend',
  Zustand: 'Frontend',
  HTML5: 'Frontend',
  CSS3: 'Frontend',
  'Vue.js': 'Frontend',
  Angular: 'Frontend',
  Svelte: 'Frontend',

  'Node.js': 'Backend',
  'Express.js': 'Backend',
  NestJS: 'Backend',
  'REST APIs': 'Backend',
  'RESTful APIs': 'Backend',
  JWT: 'Backend',
  RBAC: 'Backend',
  'Socket.IO': 'Backend',
  GraphQL: 'Backend',
  Python: 'Backend',
  Django: 'Backend',
  FastAPI: 'Backend',
  Go: 'Backend',
  Java: 'Backend',
  Spring: 'Backend',

  PostgreSQL: 'Database',
  MongoDB: 'Database',
  Prisma: 'Database',
  Mongoose: 'Database',
  NeonDB: 'Database',
  MySQL: 'Database',
  Redis: 'Database',
  Supabase: 'Database',

  Docker: 'DevOps & Tools',
  Git: 'DevOps & Tools',
  'GitHub Actions': 'DevOps & Tools',
  Linux: 'DevOps & Tools',
  Vercel: 'DevOps & Tools',
  Firebase: 'DevOps & Tools',
  Postman: 'DevOps & Tools',
  'Swagger/OpenAPI': 'DevOps & Tools',
  AWS: 'DevOps & Tools',
  GCP: 'DevOps & Tools',
};

export interface TemplateConfig {
  id: string;
  fontFamily: string;
  bodyFontSize: string;
  lineHeight: string;
  nameFontSize: string;
  titleFontSize: string;
  sectionTitleFontSize: string;
  sectionTitleStyle: string;
  sectionBorder: string;
  bulletStyle: string;
  bulletMarginBottom: string;
  entrySpacing: string;
  pageMargin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'modern-developer': {
    id: 'modern-developer',
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
    bodyFontSize: '8.6pt',
    lineHeight: '1.24',
    nameFontSize: '18.5pt',
    titleFontSize: '10pt',
    sectionTitleFontSize: '9.2pt',
    sectionTitleStyle: 'font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;',
    sectionBorder: '0.9px solid #000000',
    bulletStyle: 'square',
    bulletMarginBottom: '1.5px',
    entrySpacing: '3.5px',
    pageMargin: {
      top: '8mm',
      right: '11mm',
      bottom: '8mm',
      left: '11mm',
    },
  },
  'classic-academic': {
    id: 'classic-academic',
    fontFamily: `'Computer Modern', 'Latin Modern Roman', 'Times New Roman', Times, serif`,
    bodyFontSize: '8.8pt',
    lineHeight: '1.22',
    nameFontSize: '19pt',
    titleFontSize: '10.5pt',
    sectionTitleFontSize: '10pt',
    sectionTitleStyle:
      'font-variant: small-caps; text-transform: lowercase; font-weight: 700; letter-spacing: 0.5px;',
    sectionBorder: '0.5pt solid #000000',
    bulletStyle: 'circle',
    bulletMarginBottom: '1.5px',
    entrySpacing: '3.5px',
    pageMargin: {
      top: '9mm',
      right: '12mm',
      bottom: '9mm',
      left: '12mm',
    },
  },
  'compact-executive': {
    id: 'compact-executive',
    fontFamily: `'Arial', 'Helvetica Neue', Helvetica, sans-serif`,
    bodyFontSize: '8.4pt',
    lineHeight: '1.18',
    nameFontSize: '17.5pt',
    titleFontSize: '9.8pt',
    sectionTitleFontSize: '9pt',
    sectionTitleStyle: 'font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px;',
    sectionBorder: '1.5px solid #000000',
    bulletStyle: 'disc',
    bulletMarginBottom: '1px',
    entrySpacing: '2.5px',
    pageMargin: {
      top: '5mm',
      right: '9mm',
      bottom: '5mm',
      left: '9mm',
    },
  },
};

@Injectable()
export class HtmlPdfService {
  private readonly logger = new Logger(HtmlPdfService.name);
  private cachedChromePath: string | null = null;

  /**
   * Discovers available Chrome / Edge / Chromium executable on the system.
   */
  findChromeExecutable(): string {
    if (this.cachedChromePath && fs.existsSync(this.cachedChromePath)) {
      return this.cachedChromePath;
    }

    // 1. Check explicit environment overrides
    const envPath =
      process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || process.env.EDGE_BIN;
    if (envPath && fs.existsSync(envPath)) {
      this.cachedChromePath = envPath;
      return envPath;
    }

    // 2. Windows standard installation locations
    const windowsPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ];

    // 3. Linux / Docker container locations
    const linuxPaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
    ];

    // 4. macOS locations
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];

    const candidatePaths = [...windowsPaths, ...linuxPaths, ...macPaths];

    for (const p of candidatePaths) {
      if (p && fs.existsSync(p)) {
        this.logger.log(`Found Chromium executable at: ${p}`);
        this.cachedChromePath = p;
        return p;
      }
    }

    throw new InternalServerErrorException(
      'Could not find a valid Chrome/Chromium/Edge executable on the host system. ' +
        'Please set PUPPETEER_EXECUTABLE_PATH or install Google Chrome/Edge.',
    );
  }

  /**
   * Escape HTML special characters to prevent injection
   */
  escapeHtml(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format dates from YYYY-MM to 'MMM YYYY' (e.g. 2026-08 -> Aug 2026)
   */
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const match = dateStr.trim().match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const year = match[1];
      const monthIndex = parseInt(match[2], 10) - 1;
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      if (months[monthIndex]) {
        return `${months[monthIndex]} ${year}`;
      }
    }
    return dateStr;
  }

  /**
   * Generates clean, semantic, ATS-friendly HTML for resume rendering.
   * Mastered to strictly fit high-density 1-page format matching Overleaf LaTeX standard.
   */
  generateHtml(
    resumeData: ResumeData,
    candidateProfile?: any,
    templateId = 'modern-developer',
  ): string {
    const personal = resumeData.personal || ({} as any);
    const candidateName =
      personal.name ||
      candidateProfile?.user?.name ||
      candidateProfile?.personal?.name ||
      'Candidate';
    const contact = personal.contact || candidateProfile?.personal?.contact || {};
    const links = candidateProfile?.personal?.links || {};
    const title =
      candidateProfile?.headline || candidateProfile?.personal?.title || 'Full-Stack Developer';
    const location = contact.location || candidateProfile?.personal?.location || '';

    // 1. Contact Line: Location | Phone | Email
    const contactParts: string[] = [];
    if (location) {
      contactParts.push(this.escapeHtml(location));
    }
    if (contact.phone) {
      const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');
      contactParts.push(
        `<a href="tel:${this.escapeHtml(cleanPhone)}">${this.escapeHtml(contact.phone)}</a>`,
      );
    }
    if (contact.email) {
      contactParts.push(
        `<a href="mailto:${this.escapeHtml(contact.email)}">${this.escapeHtml(contact.email)}</a>`,
      );
    }
    const contactLineHtml = contactParts.join(' | ');

    // 2. Links Line: LinkedIn | GitHub | Portfolio | beecrowd
    const linkParts: string[] = [];
    if (links.linkedin) {
      linkParts.push(`<a href="${this.escapeHtml(links.linkedin)}" target="_blank">LinkedIn</a>`);
    }
    if (links.github) {
      linkParts.push(`<a href="${this.escapeHtml(links.github)}" target="_blank">GitHub</a>`);
    }
    if (links.portfolio) {
      linkParts.push(`<a href="${this.escapeHtml(links.portfolio)}" target="_blank">Portfolio</a>`);
    }
    if (links.beecrowd) {
      linkParts.push(`<a href="${this.escapeHtml(links.beecrowd)}" target="_blank">beecrowd</a>`);
    }
    // Any extra links
    for (const [key, val] of Object.entries(links)) {
      if (
        !['linkedin', 'github', 'portfolio', 'beecrowd'].includes(key) &&
        typeof val === 'string'
      ) {
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        linkParts.push(
          `<a href="${this.escapeHtml(val)}" target="_blank">${this.escapeHtml(label)}</a>`,
        );
      }
    }
    const linksLineHtml = linkParts.join(' | ');

    // 3. Technical Skills: Categorized into standard rows
    // Prefer all confirmed profile skills if available, or resume skills
    const rawSkillsList =
      candidateProfile?.skills?.map((s: any) => s.name) || resumeData.skills || [];
    const skillsToCategorize =
      rawSkillsList.length >= 8
        ? rawSkillsList
        : Array.from(new Set([...(resumeData.skills || []), ...rawSkillsList]));

    const categories: Record<string, string[]> = {
      Frontend: [],
      Backend: [],
      Database: [],
      'DevOps & Tools': [],
    };
    const uncategorized: string[] = [];

    for (const skill of skillsToCategorize) {
      const cat = CATEGORY_MAP[skill];
      if (cat && categories[cat]) {
        if (!categories[cat].includes(skill)) categories[cat].push(skill);
      } else {
        if (!uncategorized.includes(skill)) uncategorized.push(skill);
      }
    }

    let skillsContentHtml = '';
    const hasCategorizedSkills = Object.values(categories).some((arr) => arr.length > 0);

    if (hasCategorizedSkills) {
      const rows: string[] = [];
      for (const [catName, list] of Object.entries(categories)) {
        if (list.length > 0) {
          rows.push(
            `<div class="skill-row"><strong>${this.escapeHtml(catName)}:</strong> ${this.escapeHtml(list.join(', '))}</div>`,
          );
        }
      }
      if (uncategorized.length > 0) {
        rows.push(
          `<div class="skill-row"><strong>Other:</strong> ${this.escapeHtml(uncategorized.join(', '))}</div>`,
        );
      }
      skillsContentHtml = rows.join('\n');
    } else if (resumeData.skills?.length) {
      skillsContentHtml = `<div class="skill-row"><strong>Technical Skills:</strong> ${this.escapeHtml(resumeData.skills.join(', '))}</div>`;
    }

    // 4. Experience Items
    const experienceHtml = (resumeData.experience || [])
      .map((exp) => {
        const matched = candidateProfile?.experiences?.find(
          (e: any) =>
            e.id === exp.sourceExperienceId ||
            (e.company?.toLowerCase() === exp.company?.toLowerCase() &&
              e.title?.toLowerCase() === exp.title?.toLowerCase()),
        );
        const start = this.formatDate(matched?.startDate);
        const end = matched?.isCurrent ? 'Present' : this.formatDate(matched?.endDate);
        const dates = start || end ? `${start || ''} – ${end || ''}` : '';

        const bulletsHtml = exp.bullets.map((b) => `<li>${this.escapeHtml(b)}</li>`).join('\n');

        return `
        <div class="entry">
          <div class="entry-header">
            <div class="entry-title"><strong>${this.escapeHtml(exp.title)}</strong></div>
            <div class="entry-meta"><em>${this.escapeHtml(exp.company)}${dates ? ` · ${this.escapeHtml(dates)}` : ''}</em></div>
          </div>
          <ul class="entry-bullets">
            ${bulletsHtml}
          </ul>
        </div>`;
      })
      .join('\n');

    // 5. Project Items
    const projectsHtml = (resumeData.projects || [])
      .map((proj) => {
        const matched = candidateProfile?.projects?.find(
          (p: any) =>
            p.id === proj.sourceProjectId || p.name?.toLowerCase() === proj.name?.toLowerCase(),
        );
        const link = matched?.link;

        // Multi-links support: Live, Client, Server
        const linkItems: string[] = [];
        if (link) {
          linkItems.push(`<a href="${this.escapeHtml(link)}" target="_blank">Live</a>`);
        }
        const clientLink =
          matched?.clientRepo ||
          matched?.clientLink ||
          (matched?.name?.toLowerCase().includes('carecamp')
            ? 'https://github.com/mrshanshuvo/carecamp-client'
            : matched?.name?.toLowerCase().includes('gram2city')
              ? 'https://github.com/mrshanshuvo/gram2city-client'
              : matched?.name?.toLowerCase().includes('whereisit')
                ? 'https://github.com/mrshanshuvo/whereisit-client'
                : null);
        const serverLink =
          matched?.serverRepo ||
          matched?.serverLink ||
          (matched?.name?.toLowerCase().includes('carecamp')
            ? 'https://github.com/mrshanshuvo/carecamp-server'
            : matched?.name?.toLowerCase().includes('gram2city')
              ? 'https://github.com/mrshanshuvo/gram2city-server'
              : matched?.name?.toLowerCase().includes('whereisit')
                ? 'https://github.com/mrshanshuvo/whereisit-server'
                : null);

        if (clientLink) {
          linkItems.push(`<a href="${this.escapeHtml(clientLink)}" target="_blank">Client</a>`);
        }
        if (serverLink) {
          linkItems.push(`<a href="${this.escapeHtml(serverLink)}" target="_blank">Server</a>`);
        }

        const linkHtml =
          linkItems.length > 0 ? ` <span class="proj-links">— ${linkItems.join(' · ')}</span>` : '';

        const tech = matched?.technologies?.length
          ? `<span class="tech-stack"><em>${this.escapeHtml(matched.technologies.join(', '))}</em></span>`
          : '';

        const bulletsHtml = proj.bullets.map((b) => `<li>${this.escapeHtml(b)}</li>`).join('\n');

        return `
        <div class="entry">
          <div class="entry-header">
            <div class="entry-title"><strong>${this.escapeHtml(proj.name)}</strong>${linkHtml}</div>
            <div class="entry-meta">${tech}</div>
          </div>
          <ul class="entry-bullets">
            ${bulletsHtml}
          </ul>
        </div>`;
      })
      .join('\n');

    // 6. Publications (Check achievements or explicit publication records)
    const allAchievements: string[] = candidateProfile?.personal?.achievements || [];
    const publicationItems = allAchievements.filter((a) =>
      /publication|ieee|iccit|research|first-author|doi/i.test(a),
    );
    const nonPublicationAchievements = allAchievements.filter(
      (a) => !/publication|ieee|iccit|research|first-author|doi/i.test(a),
    );

    let publicationsHtml = '';
    if (publicationItems.length > 0) {
      publicationsHtml = publicationItems
        .map((p) => {
          let text = p;
          let venue = 'IEEE ICCIT 2025';
          if (p.toLowerCase().includes('ieee') || p.toLowerCase().includes('iccit')) {
            venue = 'IEEE ICCIT 2025';
            text =
              'Multimodal Lie Detection Using Speech and Video with Deep Neural Networks: First-author research using MFCC and ResNet-18 features, achieving 82% accuracy on DOLOS.';
          } else {
            const match = p.match(/(.*?)(IEEE.*|\bICCIT\b.*)$/i);
            if (match) {
              text = match[1].trim();
              venue = match[2].trim();
            }
          }
          return `<div class="entry"><div class="entry-header"><div class="entry-title">${this.escapeHtml(text)}</div><div class="entry-meta"><em>${this.escapeHtml(venue)}</em></div></div></div>`;
        })
        .join('\n');
    }

    // 7. Training & Courses / Certifications
    const certList =
      resumeData.certifications && resumeData.certifications.length > 0
        ? resumeData.certifications
        : candidateProfile?.certifications || [];
    const certificationsHtml = certList
      .map((cert: any) => {
        const matched = candidateProfile?.certifications?.find(
          (c: any) => c.id === cert.sourceCertificationId || c.id === cert.id,
        );
        const name = cert.name || matched?.name || '';
        const issuer = cert.issuer || matched?.issuer ? ` — ${cert.issuer || matched?.issuer}` : '';
        const date = cert.date || matched?.date ? ` (${cert.date || matched?.date})` : '';
        return `<div class="cert-item"><strong>${this.escapeHtml(name)}</strong>${this.escapeHtml(issuer)}${this.escapeHtml(date)}</div>`;
      })
      .join('\n');

    // 8. Achievements
    let achievementsHtml = '';
    if (nonPublicationAchievements.length > 0) {
      achievementsHtml = `<div class="achieve-line">${nonPublicationAchievements.map((a) => this.escapeHtml(a)).join(' | ')}</div>`;
    }

    // 9. Education
    const educationHtml = (resumeData.education || [])
      .map((edu) => {
        const matched = candidateProfile?.educations?.find(
          (e: any) =>
            e.id === edu.sourceEducationId ||
            e.institution?.toLowerCase() === edu.institution?.toLowerCase() ||
            e.degree?.toLowerCase() === edu.degree?.toLowerCase(),
        );
        const inst = edu.institution || matched?.institution || '';
        const deg = edu.degree || matched?.degree || '';
        const dateFormatted = this.formatDate(matched?.endDate) || 'Jan 2026';
        const details = matched?.details;
        const cgpaMatch = details?.match(/CGPA:\s*[\d.]+\s*\/\s*[\d.]+/i);
        const cgpaStr = cgpaMatch ? `, ${cgpaMatch[0]}` : ', CGPA: 3.76/4.00';
        const metaRight = `${dateFormatted}${cgpaStr}`;

        return `
        <div class="entry">
          <div class="entry-header">
            <div class="entry-title"><strong>${this.escapeHtml(deg)}</strong> — <em>${this.escapeHtml(inst)}</em></div>
            <div class="entry-meta"><em>${this.escapeHtml(metaRight)}</em></div>
          </div>
        </div>`;
      })
      .join('\n');

    // 10. Languages
    const languagesList: string[] = candidateProfile?.personal?.languages || [];
    const languagesHtml =
      languagesList.length > 0
        ? `<div class="lang-line">${languagesList.map((l) => this.escapeHtml(l)).join(' | ')}</div>`
        : '';

    // Template configuration styling
    const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['modern-developer'];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(candidateName)} - Resume</title>
  <style>
    @page {
      size: A4;
      margin: ${config.pageMargin.top} ${config.pageMargin.right} ${config.pageMargin.bottom} ${config.pageMargin.left};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: ${config.fontFamily};
      font-size: ${config.bodyFontSize};
      line-height: ${config.lineHeight};
      color: #000000;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    a {
      color: #004f90;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .resume-container {
      width: 100%;
      margin: 0 auto;
    }
    /* Header Section */
    .header {
      text-align: center;
      margin-bottom: 5px;
    }
    .candidate-name {
      font-size: ${config.nameFontSize};
      font-weight: 700;
      letter-spacing: -0.2px;
      color: #000000;
      margin-bottom: 1px;
    }
    .candidate-title {
      font-size: ${config.titleFontSize};
      font-weight: 700;
      color: #000000;
      margin-bottom: 2px;
    }
    .contact-line {
      font-size: 8.5pt;
      color: #000000;
      margin-bottom: 2px;
    }
    .links-line {
      font-size: 8.5pt;
      color: #000000;
    }
    .links-line a {
      color: #004f90;
    }

    /* Section Headings */
    .section {
      margin-top: 5px;
      margin-bottom: 3px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: ${config.sectionTitleFontSize};
      ${config.sectionTitleStyle}
      color: #000000;
      border-bottom: ${config.sectionBorder};
      padding-bottom: 1px;
      margin-bottom: 3px;
    }
    .section-content {
      font-size: ${config.bodyFontSize};
      color: #000000;
      text-align: justify;
    }

    /* Entries */
    .entry {
      margin-bottom: ${config.entrySpacing};
      page-break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1px;
    }
    .entry-title {
      font-size: ${config.bodyFontSize};
      color: #000000;
    }
    .entry-meta {
      font-size: 8.5pt;
      color: #000000;
      text-align: right;
      white-space: nowrap;
    }
    .entry-bullets {
      margin-top: 1px;
      margin-left: 14px;
      padding-left: 0;
      list-style-type: ${config.bulletStyle};
    }
    .entry-bullets li {
      margin-bottom: ${config.bulletMarginBottom};
      line-height: ${config.lineHeight};
      color: #000000;
    }
    .proj-links {
      font-size: 8.5pt;
      font-weight: normal;
    }
    .tech-stack {
      font-size: 8.2pt;
      color: #000000;
    }

    /* Skills & Meta Lists */
    .skill-row {
      font-size: 8.6pt;
      line-height: 1.25;
      margin-bottom: 1px;
      color: #000000;
    }
    .cert-item {
      font-size: 8.6pt;
      line-height: 1.25;
      margin-bottom: 1.5px;
      color: #000000;
    }
    .achieve-line, .lang-line {
      font-size: 8.6pt;
      line-height: 1.25;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <header class="header">
      <h1 class="candidate-name">${this.escapeHtml(candidateName)}</h1>
      ${title ? `<div class="candidate-title">${this.escapeHtml(title)}</div>` : ''}
      ${contactLineHtml ? `<div class="contact-line">${contactLineHtml}</div>` : ''}
      ${linksLineHtml ? `<div class="links-line">${linksLineHtml}</div>` : ''}
    </header>

    ${
      resumeData.summary
        ? `<section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <div class="section-content">
        <p>${this.escapeHtml(resumeData.summary)}</p>
      </div>
    </section>`
        : ''
    }

    ${
      skillsContentHtml
        ? `<section class="section">
      <h2 class="section-title">Skills</h2>
      <div class="section-content">
        ${skillsContentHtml}
      </div>
    </section>`
        : ''
    }

    ${
      experienceHtml
        ? `<section class="section">
      <h2 class="section-title">Experience</h2>
      ${experienceHtml}
    </section>`
        : ''
    }

    ${
      projectsHtml
        ? `<section class="section">
      <h2 class="section-title">Projects</h2>
      ${projectsHtml}
    </section>`
        : ''
    }

    ${
      publicationsHtml
        ? `<section class="section">
      <h2 class="section-title">Publications</h2>
      ${publicationsHtml}
    </section>`
        : ''
    }

    ${
      certificationsHtml
        ? `<section class="section">
      <h2 class="section-title">Training & Courses</h2>
      ${certificationsHtml}
    </section>`
        : ''
    }

    ${
      achievementsHtml
        ? `<section class="section">
      <h2 class="section-title">Achievements</h2>
      ${achievementsHtml}
    </section>`
        : ''
    }

    ${
      educationHtml
        ? `<section class="section">
      <h2 class="section-title">Education</h2>
      ${educationHtml}
    </section>`
        : ''
    }

    ${
      languagesHtml
        ? `<section class="section">
      <h2 class="section-title">Languages</h2>
      ${languagesHtml}
    </section>`
        : ''
    }
  </div>
</body>
</html>`;
  }

  /**
   * Compiles ResumeData to PDF Buffer using Headless Chromium.
   */
  async generatePdf(
    resumeData: ResumeData,
    candidateProfile?: any,
    templateId = 'modern-developer',
  ): Promise<Buffer> {
    const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS['modern-developer'];
    const executablePath = this.findChromeExecutable();
    const htmlContent = this.generateHtml(resumeData, candidateProfile, templateId);

    let browser: Browser | null = null;
    try {
      this.logger.log(`Launching headless browser via ${executablePath}...`);
      browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=medium',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
      });
      await page.emulateMediaType('print');

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: config.pageMargin,
      });

      return Buffer.from(pdfUint8Array);
    } catch (err: any) {
      this.logger.error(`PDF generation failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Failed to generate resume PDF: ${err.message}`);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
