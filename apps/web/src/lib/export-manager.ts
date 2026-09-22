import { downloadResumePdf, fetchResumePdfBlob } from '@/lib/api-client';
import {
  generateAtsJsonResume,
  generateMarkdownResume,
  generatePlainTextResume,
} from '@/lib/plainTextResume';
import { downloadZip, triggerFileDownload } from '@/lib/zip';

export { downloadResumePdf, downloadZip, triggerFileDownload };

/**
 * Sanitizes candidate names or strings into URL/filesystem-safe filename bases.
 */
export function sanitizeFilename(name?: string | null, fallback = 'Candidate'): string {
  const cleaned = (name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback.toLowerCase();
}

/**
 * Opens LaTeX code directly into Overleaf via a hidden form submission.
 */
export function openInOverleaf(latexCode: string): void {
  if (typeof document === 'undefined' || !latexCode) return;
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.overleaf.com/docs';
  form.target = '_blank';

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'snip';
  input.value = latexCode;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/**
 * Triggers a download of plain text content.
 */
export function downloadText(filename: string, text: string, mimeType = 'text/plain'): void {
  triggerFileDownload(filename, text, mimeType);
}

/**
 * Triggers a download of LaTeX (.tex) source code.
 */
export function downloadLatex(filename: string, latexCode: string): void {
  triggerFileDownload(filename, latexCode, 'application/x-tex');
}

/**
 * Triggers a download of Markdown (.md) content.
 */
export function downloadMarkdown(filename: string, markdown: string): void {
  triggerFileDownload(filename, markdown, 'text/markdown');
}

/**
 * Triggers a download of JSON content with standard indentation.
 */
export function downloadJson(filename: string, data: unknown): void {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  triggerFileDownload(filename, jsonStr, 'application/json');
}

export interface CompleteZipPackageOptions {
  candidateName?: string;
  templateId?: string;
  templateName?: string;
  latexCode: string;
  resumeJson: any;
  validationReport?: any;
  jobId?: string;
  version?: string;
}

/**
 * Assembles and downloads the full candidate resume package as a .zip archive,
 * including raw LaTeX, ATS JSON, evidence ledger, plain text, Markdown, README,
 * and all 3 compiled PDF styling variants in parallel.
 */
export async function downloadCompleteResumeZip(options: CompleteZipPackageOptions): Promise<void> {
  const {
    candidateName,
    templateId: _templateId = 'modern-developer',
    templateName = 'Modern Developer',
    latexCode,
    resumeJson,
    validationReport,
    jobId,
    version,
  } = options;

  const safeFilenameBase = sanitizeFilename(candidateName || resumeJson?.personal?.name);
  const plainText = generatePlainTextResume(resumeJson);
  const markdown = generateMarkdownResume(resumeJson);
  const atsJson = JSON.stringify(generateAtsJsonResume(resumeJson), null, 2);
  const rawJson = JSON.stringify(resumeJson, null, 2);
  const reportJson = validationReport ? JSON.stringify(validationReport, null, 2) : null;

  const displayName = candidateName || resumeJson?.personal?.name || 'Candidate';

  const readme = `# ${displayName} — Complete Tailored Application Package (${templateName})
This archive contains your tailored, audited resume generated deterministically by Praman.

## Included ATS Resume PDF Styling Variants:
1. **resume_modern-developer.pdf**: Clean Helvetica/Inter sans-serif, high-contrast dark typography (#000000), deep navy (#004F90) link accents, square bullet highlights.
2. **resume_classic-academic.pdf**: Traditional Computer Modern / Latin Modern Roman serif, small-caps section headings, academic rules.
3. **resume_compact-executive.pdf**: Ultra-dense executive layout, bold leadership headers, tight margins maximizing 1-page capacity.

## Source & Data Files:
- **resume.tex**: Raw LaTeX source code formatted in the "${templateName}" design.
- **resume_ats.json**: Standardized ATS-ready canonical JSON resume.
- **resume_evidence.json**: Raw ground-truth ledger data with verified source IDs.
- **validation_report.json**: Claim verification audit report.
- **resume.txt**: Clean ASCII text formatted for online application textareas.
- **resume.md**: GitHub-flavored Markdown for documentation and online portals.

## Compilation Instructions:
\`\`\`bash
# Standard TeX Live / MacTeX / MiKTeX
pdflatex resume.tex
# Or with XeLaTeX
xelatex resume.tex
\`\`\`

## Cloud Editing:
Upload this .zip directly to [Overleaf](https://www.overleaf.com) via 'New Project' -> 'Upload Project'.
`;

  const files: Record<string, string | Uint8Array> = {
    'resume.tex': latexCode,
    'resume_ats.json': atsJson,
    'resume_evidence.json': rawJson,
    'resume.txt': plainText,
    'resume.md': markdown,
    'README.md': readme,
  };

  if (reportJson) {
    files['validation_report.json'] = reportJson;
  }

  if (jobId) {
    const templates = ['modern-developer', 'classic-academic', 'compact-executive'];
    const pdfResults = await Promise.allSettled(
      templates.map(async (tmpl) => {
        const blob = await fetchResumePdfBlob(jobId, tmpl, version);
        const arrayBuffer = await blob.arrayBuffer();
        return { tmpl, data: new Uint8Array(arrayBuffer) };
      }),
    );

    for (const res of pdfResults) {
      if (res.status === 'fulfilled') {
        files[`resume_${res.value.tmpl}.pdf`] = res.value.data;
      }
    }
  }

  downloadZip(`${safeFilenameBase}_complete_package.zip`, files);
}
