import fs from 'node:fs';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import type { ResumeData } from '@praman/schemas';
import puppeteer, { type Browser } from 'puppeteer-core';

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
   * Generates clean, semantic, ATS-friendly HTML for resume rendering.
   */
  generateHtml(
    resumeData: ResumeData,
    candidateProfile?: any,
    templateId = 'modern-developer',
  ): string {
    const personal = resumeData.personal || ({} as any);
    const candidateName = personal.name || candidateProfile?.user?.name || 'Candidate';
    const contact = personal.contact || {};
    const links = candidateProfile?.personal?.links || {};
    const title = candidateProfile?.headline || candidateProfile?.personal?.title;

    // Contact info items
    const contactItems: string[] = [];
    if (contact.location) {
      contactItems.push(`<span>${this.escapeHtml(contact.location)}</span>`);
    }
    if (contact.email) {
      contactItems.push(
        `<a href="mailto:${this.escapeHtml(contact.email)}">${this.escapeHtml(contact.email)}</a>`,
      );
    }
    if (contact.phone) {
      const cleanPhone = contact.phone.replace(/[^0-9+]/g, '');
      contactItems.push(
        `<a href="tel:${this.escapeHtml(cleanPhone)}">${this.escapeHtml(contact.phone)}</a>`,
      );
    }
    if (links.linkedin) {
      const displayLinkedin = links.linkedin.replace(
        /^https?:\/\/(www\.)?linkedin\.com\/in\//,
        'in/',
      );
      contactItems.push(
        `<a href="${this.escapeHtml(links.linkedin)}" target="_blank">${this.escapeHtml(displayLinkedin)}</a>`,
      );
    }
    if (links.github) {
      const displayGithub = links.github.replace(/^https?:\/\/(www\.)?github\.com\//, 'gh/');
      contactItems.push(
        `<a href="${this.escapeHtml(links.github)}" target="_blank">${this.escapeHtml(displayGithub)}</a>`,
      );
    }
    if (links.portfolio) {
      const displayPortfolio = links.portfolio.replace(/^https?:\/\/(www\.)?/, '');
      contactItems.push(
        `<a href="${this.escapeHtml(links.portfolio)}" target="_blank">${this.escapeHtml(displayPortfolio)}</a>`,
      );
    }

    // Experience Items
    const experienceHtml = (resumeData.experience || [])
      .map((exp) => {
        const matched = candidateProfile?.experiences?.find(
          (e: any) => e.id === exp.sourceExperienceId,
        );
        const dates = matched
          ? `${matched.startDate || ''} – ${matched.isCurrent ? 'Present' : matched.endDate || ''}`
          : '';

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

    // Project Items
    const projectsHtml = (resumeData.projects || [])
      .map((proj) => {
        const matched = candidateProfile?.projects?.find((p: any) => p.id === proj.sourceProjectId);
        const link = matched?.link;
        const linkHtml = link
          ? ` <a href="${this.escapeHtml(link)}" target="_blank" class="live-link">[Live]</a>`
          : '';
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

    // Education Items
    const educationHtml = (resumeData.education || [])
      .map((edu) => {
        const matched = candidateProfile?.educations?.find(
          (e: any) => e.id === edu.sourceEducationId,
        );
        const inst = edu.institution || matched?.institution || '';
        const deg = edu.degree || matched?.degree || '';
        const dates = matched?.endDate || '';

        return `
        <div class="entry">
          <div class="entry-header">
            <div class="entry-title"><strong>${this.escapeHtml(deg)}</strong>${inst ? ` — ${this.escapeHtml(inst)}` : ''}</div>
            <div class="entry-meta"><em>${this.escapeHtml(dates)}</em></div>
          </div>
        </div>`;
      })
      .join('\n');

    // Certifications Items
    const certificationsHtml = (resumeData.certifications || [])
      .map((cert) => {
        const matched = candidateProfile?.certifications?.find(
          (c: any) => c.id === cert.sourceCertificationId,
        );
        const name = cert.name || matched?.name || '';
        const issuer = matched?.issuer ? ` — ${matched.issuer}` : '';
        const date = matched?.date || '';

        return `
        <div class="entry">
          <div class="entry-header">
            <div class="entry-title"><strong>${this.escapeHtml(name)}</strong>${this.escapeHtml(issuer)}</div>
            <div class="entry-meta"><em>${this.escapeHtml(date)}</em></div>
          </div>
        </div>`;
      })
      .join('\n');

    // Font selection and styling theme
    const isAcademic = templateId === 'classic-academic';
    const isCompact = templateId === 'compact-executive';

    const fontFamily = isAcademic
      ? `'Georgia', 'Times New Roman', serif`
      : `'Helvetica Neue', Helvetica, Arial, sans-serif`;

    const accentColor = isAcademic ? '#19284b' : '#004f90';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(candidateName)} - Resume</title>
  <style>
    @page {
      size: A4;
      margin: ${isCompact ? '12mm 14mm' : '15mm 16mm'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: ${fontFamily};
      font-size: ${isCompact ? '9.5pt' : '10pt'};
      line-height: ${isCompact ? '1.3' : '1.35'};
      color: #1a1a1a;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    a {
      color: ${accentColor};
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .resume-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    /* Header Section */
    .header {
      text-align: center;
      margin-bottom: ${isCompact ? '10px' : '14px'};
    }
    .candidate-name {
      font-size: ${isCompact ? '20pt' : '22pt'};
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #0f172a;
      margin-bottom: 2px;
      ${isAcademic ? 'text-transform: uppercase; font-size: 19pt; letter-spacing: 1px;' : ''}
    }
    .candidate-title {
      font-size: 11pt;
      font-weight: 600;
      color: ${accentColor};
      margin-bottom: 4px;
    }
    .contact-line {
      font-size: 9pt;
      color: #475569;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .contact-line span, .contact-line a {
      display: inline-block;
    }
    .contact-line span:not(:last-child)::after {
      content: "•";
      margin-left: 8px;
      color: #94a3b8;
    }
    /* Section Headings */
    .section {
      margin-bottom: ${isCompact ? '10px' : '13px'};
      page-break-inside: avoid;
    }
    .section-title {
      font-size: ${isCompact ? '10.5pt' : '11pt'};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1.5px solid ${accentColor};
      padding-bottom: 2px;
      margin-bottom: 6px;
    }
    .section-content {
      font-size: ${isCompact ? '9.5pt' : '10pt'};
      color: #334155;
    }
    /* Entries */
    .entry {
      margin-bottom: ${isCompact ? '6px' : '8px'};
      page-break-inside: avoid;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .entry-title {
      font-size: ${isCompact ? '9.5pt' : '10pt'};
      color: #0f172a;
    }
    .entry-meta {
      font-size: 9pt;
      color: #475569;
      text-align: right;
      white-space: nowrap;
    }
    .entry-bullets {
      margin-top: 2px;
      margin-left: 16px;
      padding-left: 0;
    }
    .entry-bullets li {
      margin-bottom: ${isCompact ? '2px' : '3px'};
      line-height: ${isCompact ? '1.28' : '1.32'};
    }
    .live-link {
      font-size: 8.5pt;
      font-weight: 600;
      margin-left: 4px;
    }
    .skills-list {
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <header class="header">
      <h1 class="candidate-name">${this.escapeHtml(candidateName)}</h1>
      ${title ? `<div class="candidate-title">${this.escapeHtml(title)}</div>` : ''}
      <div class="contact-line">
        ${contactItems.map((item) => `<span>${item}</span>`).join('')}
      </div>
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
      resumeData.skills && resumeData.skills.length > 0
        ? `<section class="section">
      <h2 class="section-title">Skills</h2>
      <div class="section-content skills-list">
        <strong>Technical Skills:</strong> ${this.escapeHtml(resumeData.skills.join(', '))}
      </div>
    </section>`
        : ''
    }

    ${
      experienceHtml
        ? `<section class="section">
      <h2 class="section-title">Work Experience</h2>
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
      educationHtml
        ? `<section class="section">
      <h2 class="section-title">Education</h2>
      ${educationHtml}
    </section>`
        : ''
    }

    ${
      certificationsHtml
        ? `<section class="section">
      <h2 class="section-title">Certifications</h2>
      ${certificationsHtml}
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

      const isCompact = templateId === 'compact-executive';

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: isCompact ? '12mm' : '15mm',
          right: isCompact ? '14mm' : '16mm',
          bottom: isCompact ? '12mm' : '15mm',
          left: isCompact ? '14mm' : '16mm',
        },
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
