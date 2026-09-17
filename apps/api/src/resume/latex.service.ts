import { Injectable, Logger, Optional } from "@nestjs/common";
import type { ResumeData } from "@praman/schemas";
import { StorageService } from "../storage/storage.service.js";

@Injectable()
export class LatexService {
  private readonly logger = new Logger(LatexService.name);
  private templateCache = new Map<string, string>();

  constructor(@Optional() private readonly storageService?: StorageService) {}

  /**
   * Fetches LaTeX template directly from Cloudflare R2 with in-memory caching
   */
  async getTemplate(templateId = "modern-developer"): Promise<string> {
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    const r2Key = `templates/${templateId}.tex`;

    if (this.storageService) {
      try {
        const r2Template = await this.storageService.getFileString(r2Key);
        if (r2Template) {
          this.logger.log(`Loaded template '${templateId}' from Cloudflare R2`);
          this.templateCache.set(templateId, r2Template);
          return r2Template;
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to retrieve template '${templateId}' from R2: ${err.message}`,
        );
      }
    }

    // Built-in resilient fallback for 'modern-developer'
    if (templateId === "modern-developer") {
      const fallback = `\\documentclass[10pt, a4paper]{article}
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}
\\usepackage{setspace}
\\setstretch{1.10}
\\usepackage[ignoreheadfoot, top=0.75cm, bottom=0.75cm, left=1cm, right=1cm]{geometry}
\\usepackage{titlesec, tabularx, array, xcolor, enumitem, amsmath}
\\definecolor{primaryColor}{RGB}{0, 79, 144}
\\usepackage[pdftitle={%%FULL_NAME%%'s CV}, pdfauthor={%%FULL_NAME%%}, colorlinks=true, urlcolor=primaryColor]{hyperref}
\\usepackage{changepage, paracol, needspace, iftex}
\\usepackage{fontawesome5}
\\pagestyle{empty}
\\setcounter{secnumdepth}{0}
\\setlength{\\parindent}{0pt}
\\titleformat{\\section}{\\needspace{4\\baselineskip}\\bfseries\\large}{}{0pt}{}[\\vspace{1pt}\\titlerule]
\\titlespacing{\\section}{0pt}{0.20cm}{0.15cm}
\\newenvironment{highlights}{\\begin{itemize}[topsep=0.1cm, parsep=0.1cm, partopsep=0pt, itemsep=0pt, leftmargin=10pt]}{\\end{itemize}}
\\newenvironment{onecolentry}{\\begin{adjustwidth}{0.2cm}{0.2cm}}{\\end{adjustwidth}}
\\begin{document}
\\begin{center}
    {\\Huge \\textbf{%%FULL_NAME%%}} \\\\[3pt]
    {{TITLE_LINE}}
    {{CONTACT_LINE}} \\\\[2pt]
    {{LINKS_LINE}}
\\end{center}
{{#if SUMMARY}}
\\section{Professional Summary}
\\begin{onecolentry}
{{SUMMARY}}
\\end{onecolentry}
{{/if}}
{{#if SKILLS}}
\\section{Skills}
\\begin{onecolentry}
{{SKILLS}}
\\end{onecolentry}
{{/if}}
{{#if HAS_EXPERIENCE}}
\\section{Experience}
{{EXPERIENCE_ENTRIES}}
{{/if}}
{{#if HAS_PROJECTS}}
\\section{Projects}
{{PROJECT_ENTRIES}}
{{/if}}
{{#if HAS_EDUCATION}}
\\section{Education}
{{EDUCATION_ENTRIES}}
{{/if}}
{{#if HAS_CERTIFICATIONS}}
\\section{Certifications}
{{CERTIFICATION_ENTRIES}}
{{/if}}
\\end{document}`;
      this.templateCache.set(templateId, fallback);
      return fallback;
    }

    throw new Error(
      `Template '${templateId}' not found in Cloudflare R2 storage at key '${r2Key}'. Please ensure it is uploaded to bucket.`,
    );
  }

  /**
   * Escapes LaTeX special characters: & % $ # _ { } ~ ^ \
   */
  escapeLatex(input: string | null | undefined): string {
    if (!input) return "";
    return input
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/&/g, "\\&")
      .replace(/%/g, "\\%")
      .replace(/\$/g, "\\$")
      .replace(/#/g, "\\#")
      .replace(/_/g, "\\_")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
  }

  /**
   * Generates valid LaTeX code from ResumeData and full Candidate Profile details
   */
  async generateLatex(
    resumeData: ResumeData,
    candidateProfile?: any,
    templateId = "modern-developer",
  ): Promise<string> {
    let tex = await this.getTemplate(templateId);

    // 1. Personal / Header
    const personal = resumeData.personal || {};
    const name = this.escapeLatex(
      personal.name || candidateProfile?.user?.name || "Candidate",
    );
    tex = tex.replaceAll("%%FULL_NAME%%", name);

    // Title line
    const title =
      candidateProfile?.profile?.desiredTitle ||
      candidateProfile?.experiences?.[0]?.title;
    if (title) {
      tex = tex.replace(
        "{{TITLE_LINE}}",
        `\\textbf{${this.escapeLatex(title)}}\\\\[3pt]`,
      );
    } else {
      tex = tex.replace("{{TITLE_LINE}}", "");
    }

    // Contact info
    const contact = personal.contact || {};
    const contactParts: string[] = [];
    if (contact.location) contactParts.push(this.escapeLatex(contact.location));
    if (contact.phone) {
      const cleanPhone = contact.phone.replace(/[^0-9+]/g, "");
      contactParts.push(
        `\\href{https://wa.me/${cleanPhone}}{${this.escapeLatex(contact.phone)}}`,
      );
    }
    if (contact.email) {
      contactParts.push(
        `\\href{mailto:${contact.email}}{${this.escapeLatex(contact.email)}}`,
      );
    }
    tex = tex.replace("{{CONTACT_LINE}}", contactParts.join(" \\textbar\\ "));

    // Links (LinkedIn, GitHub, Portfolio, etc.)
    const linkParts: string[] = [];
    if (contact.linkedin) {
      linkParts.push(`\\href{${contact.linkedin}}{LinkedIn}`);
    }
    if (contact.github) {
      linkParts.push(`\\href{${contact.github}}{GitHub}`);
    }
    if (contact.portfolio) {
      linkParts.push(`\\href{${contact.portfolio}}{Portfolio}`);
    }
    tex = tex.replace("{{LINKS_LINE}}", linkParts.join(" \\textbar\\ "));

    // 2. Professional Summary
    if (resumeData.summary) {
      tex = tex.replace("{{#if SUMMARY}}", "");
      tex = tex.replace("{{/if}}", "");
      tex = tex.replace("{{SUMMARY}}", this.escapeLatex(resumeData.summary));
    } else {
      tex = tex.replace(/\{\{#if SUMMARY\}\}[\s\S]*?\{\{\/if\}\}/, "");
    }

    // 3. Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      tex = tex.replace("{{#if SKILLS}}", "");
      tex = tex.replace("{{/if}}", "");
      const skillsEscaped = resumeData.skills
        .map((s) => this.escapeLatex(s))
        .join(", ");
      tex = tex.replace("{{SKILLS}}", skillsEscaped);
    } else {
      tex = tex.replace(/\{\{#if SKILLS\}\}[\s\S]*?\{\{\/if\}\}/, "");
    }

    // 4. Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      tex = tex.replace("{{#if HAS_EXPERIENCE}}", "");
      tex = tex.replace("{{/if}}", "");

      const expBlocks = resumeData.experience.map((exp) => {
        // Find matching raw experience from candidateProfile for dates if available
        const matchedProfileExp = candidateProfile?.experiences?.find(
          (e: any) => e.id === exp.sourceExperienceId,
        );
        const dates = matchedProfileExp
          ? `${this.escapeLatex(matchedProfileExp.startDate || "")} – ${matchedProfileExp.isCurrent ? "Present" : this.escapeLatex(matchedProfileExp.endDate || "")}`
          : "";

        const headerLine = `\\textbf{${this.escapeLatex(exp.title)}} \\hfill \\textit{${this.escapeLatex(exp.company)}${dates ? ` · ${dates}` : ""}}`;
        const bullets = exp.bullets
          .map((b) => `\\item ${this.escapeLatex(b)}`)
          .join("\n");

        return `\\begin{onecolentry}\n${headerLine}\n\\begin{highlights}\n${bullets}\n\\end{highlights}\n\\end{onecolentry}\n`;
      });

      tex = tex.replace("{{EXPERIENCE_ENTRIES}}", expBlocks.join("\n"));
    } else {
      tex = tex.replace(/\{\{#if HAS_EXPERIENCE\}\}[\s\S]*?\{\{\/if\}\}/, "");
    }

    // 5. Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      tex = tex.replace("{{#if HAS_PROJECTS}}", "");
      tex = tex.replace("{{/if}}", "");

      const projBlocks = resumeData.projects.map((proj) => {
        const matchedProfileProj = candidateProfile?.projects?.find(
          (p: any) => p.id === proj.sourceProjectId,
        );
        const link = matchedProfileProj?.link;
        const linkLatex = link ? ` - \\href{${link}}{Live}` : "";
        const tech = matchedProfileProj?.technologies?.length
          ? ` \\hfill \\textit{${this.escapeLatex(matchedProfileProj.technologies.join(", "))}}`
          : "";

        const headerLine = `\\textbf{${this.escapeLatex(proj.name)}${linkLatex}}${tech}`;
        const bullets = proj.bullets
          .map((b) => `\\item ${this.escapeLatex(b)}`)
          .join("\n");

        return `\\begin{onecolentry}\n${headerLine}\n\\begin{highlights}\n${bullets}\n\\end{highlights}\n\\end{onecolentry}\n`;
      });

      tex = tex.replace("{{PROJECT_ENTRIES}}", projBlocks.join("\n"));
    } else {
      tex = tex.replace(/\{\{#if HAS_PROJECTS\}\}[\s\S]*?\{\{\/if\}\}/, "");
    }

    // 6. Education
    if (resumeData.education && resumeData.education.length > 0) {
      tex = tex.replace("{{#if HAS_EDUCATION}}", "");
      tex = tex.replace("{{/if}}", "");

      const eduBlocks = resumeData.education.map((edu) => {
        const matchedProfileEdu = candidateProfile?.educations?.find(
          (e: any) => e.id === edu.sourceEducationId,
        );
        const inst = this.escapeLatex(
          edu.institution || matchedProfileEdu?.institution || "",
        );
        const deg = this.escapeLatex(
          edu.degree || matchedProfileEdu?.degree || "",
        );
        const dates = matchedProfileEdu?.endDate
          ? ` \\hfill \\textit{${this.escapeLatex(matchedProfileEdu.endDate)}}`
          : "";

        return `\\begin{onecolentry}\n\\textbf{${deg}} — ${inst}${dates}\n\\end{onecolentry}`;
      });

      tex = tex.replace("{{EDUCATION_ENTRIES}}", eduBlocks.join("\n\n"));
    } else {
      tex = tex.replace(/\{\{#if HAS_EDUCATION\}\}[\s\S]*?\{\{\/if\}\}/, "");
    }

    // 7. Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      tex = tex.replace("{{#if HAS_CERTIFICATIONS}}", "");
      tex = tex.replace("{{/if}}", "");

      const certBlocks = resumeData.certifications.map((cert) => {
        const matchedProfileCert = candidateProfile?.certifications?.find(
          (c: any) => c.id === cert.sourceCertificationId,
        );
        const name = this.escapeLatex(
          cert.name || matchedProfileCert?.name || "",
        );
        const issuer = matchedProfileCert?.issuer
          ? ` — ${this.escapeLatex(matchedProfileCert.issuer)}`
          : "";
        const date = matchedProfileCert?.date
          ? ` \\hfill \\textit{${this.escapeLatex(matchedProfileCert.date)}}`
          : "";

        return `\\begin{onecolentry}\n\\textbf{${name}}${issuer}${date}\n\\end{onecolentry}`;
      });

      tex = tex.replace("{{CERTIFICATION_ENTRIES}}", certBlocks.join("\n\n"));
    } else {
      tex = tex.replace(
        /\{\{#if HAS_CERTIFICATIONS\}\}[\s\S]*?\{\{\/if\}\}/,
        "",
      );
    }

    return tex;
  }
}
