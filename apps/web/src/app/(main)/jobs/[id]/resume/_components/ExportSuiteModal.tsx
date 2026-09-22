'use client';

import {
  Archive,
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileDown,
  FileText,
  Palette,
  Printer,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { downloadResumePdf, fetchResumePdfBlob } from '@/hooks/usePramanApi';
import {
  generateAtsJsonResume,
  generateMarkdownResume,
  generatePlainTextResume,
} from '@/lib/plainTextResume';
import { downloadZip, triggerFileDownload } from '@/lib/zip';

export const TEMPLATE_LABELS: Record<string, { name: string; badge: string }> = {
  'modern-developer': { name: 'Modern Developer', badge: 'Tech & Engineering' },
  'classic-academic': { name: 'Classic Academic', badge: 'Formal & Academic' },
  'compact-executive': { name: 'Compact Executive', badge: '1-Page High Density' },
};

interface ExportSuiteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: any;
  latexCode?: string;
  templateId?: string;
  downloadUrl?: string | null;
  candidateName?: string;
  jobId?: string;
  version?: string;
  validationReport?: any;
}

export const ExportSuiteModal: React.FC<ExportSuiteModalProps> = ({
  isOpen,
  onOpenChange,
  resumeData,
  latexCode = '',
  templateId = 'modern-developer',
  candidateName = 'Resume',
  jobId,
  version,
  validationReport,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const safeFilenameBase = (candidateName || 'Candidate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const templateInfo = TEMPLATE_LABELS[templateId] || TEMPLATE_LABELS['modern-developer'];

  const handleCopy = (text: string, formatId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatId);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!jobId) {
      handlePrintPdf();
      return;
    }
    try {
      setIsGeneratingPdf(true);
      await downloadResumePdf(jobId, templateId, version, `${safeFilenameBase}_${templateId}.pdf`);
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      handlePrintPdf();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    onOpenChange(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownloadTex = () => {
    triggerFileDownload(`${safeFilenameBase}_${templateId}.tex`, latexCode, 'application/x-tex');
  };

  const handleDownloadTxt = () => {
    const plainText = generatePlainTextResume(resumeData);
    triggerFileDownload(`${safeFilenameBase}_resume.txt`, plainText, 'text/plain');
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdownResume(resumeData);
    triggerFileDownload(`${safeFilenameBase}_resume.md`, markdown, 'text/markdown');
  };

  const handleDownloadAtsJson = () => {
    const atsObj = generateAtsJsonResume(resumeData);
    const jsonStr = JSON.stringify(atsObj, null, 2);
    triggerFileDownload(`${safeFilenameBase}_ats_resume.json`, jsonStr, 'application/json');
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      const plainText = generatePlainTextResume(resumeData);
      const markdown = generateMarkdownResume(resumeData);
      const atsJson = JSON.stringify(generateAtsJsonResume(resumeData), null, 2);
      const rawJson = JSON.stringify(resumeData, null, 2);
      const reportJson = validationReport ? JSON.stringify(validationReport, null, 2) : null;

      const readme = `# ${candidateName} — Complete Tailored Application Package (${templateInfo.name})
This archive contains your tailored, audited resume generated deterministically by Praman.

## Included ATS Resume PDF Styling Variants:
1. **resume_modern-developer.pdf**: Clean Helvetica/Inter sans-serif, high-contrast dark typography (#000000), deep navy (#004F90) link accents, square bullet highlights.
2. **resume_classic-academic.pdf**: Traditional Computer Modern / Latin Modern Roman serif, small-caps section headings, academic rules.
3. **resume_compact-executive.pdf**: Ultra-dense executive layout, bold leadership headers, tight margins maximizing 1-page capacity.

## Source & Data Files:
- **resume.tex**: Raw LaTeX source code formatted in the "${templateInfo.name}" design.
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
    } catch (err) {
      console.error('Failed to download complete zip bundle:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleOpenOverleaf = () => {
    // Zero-failure direct POST form submission to Overleaf
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Export Resume Suite
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Export your verified, truth-grounded resume across multiple publication formats.
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="text-xs font-mono border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan flex items-center gap-1"
            >
              <Palette className="w-3 h-3" />
              <span>Style: {templateInfo.name}</span>
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 py-3">
          {/* 1. PDF Document */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 hover:border-brand-cyan/40 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-brand-cyan" />
                  <h4 className="text-sm font-semibold text-foreground">ATS Resume PDF</h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-2xs bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan font-mono"
                >
                  1-CLICK PDF
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Direct ATS-optimized A4 PDF with clean typography and selectable text. Ready to
                upload to job portals.
              </p>
            </div>
            <div className="space-y-1.5">
              <Button
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs gap-1.5 shadow-xs cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-dark" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
              </Button>
              <button
                type="button"
                onClick={handlePrintPdf}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center gap-1 pt-0.5"
              >
                <Printer className="w-3 h-3" />
                <span>Print via Browser dialog</span>
              </button>
            </div>
          </div>

          {/* 2. Overleaf Cloud Launch */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 hover:border-brand-pink/40 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-brand-pink" />
                  <h4 className="text-sm font-semibold text-foreground">Overleaf Cloud</h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-2xs bg-brand-pink/10 border-brand-pink/30 text-brand-pink font-mono"
                >
                  1-CLICK IDE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Instantly loads your tailored LaTeX into a new Overleaf project with zero CORS or
                auth limits.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleOpenOverleaf}
              className="w-full bg-brand-pink hover:bg-brand-pink/90 text-white font-semibold text-xs gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open in Overleaf</span>
            </Button>
          </div>

          {/* 3. LaTeX Source Code (.tex) */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 hover:border-border/80 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-brand-cyan" />
                  <h4 className="text-sm font-semibold text-foreground">LaTeX Source (.tex)</h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-2xs bg-muted border-border text-muted-foreground font-mono"
                >
                  {templateInfo.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Source file containing packages, geometry, and full tailored resume sections.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadTex}
                className="flex-1 text-xs border-border gap-1.5 bg-card hover:bg-muted cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .tex</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(latexCode, 'tex')}
                className="px-2.5 text-xs border-border bg-card hover:bg-muted cursor-pointer"
                title="Copy LaTeX Code"
              >
                {copiedFormat === 'tex' ? (
                  <Check className="w-3.5 h-3.5 text-brand-cyan" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* 4. Full ZIP Project Bundle */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 hover:border-border/80 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-warning" />
                  <h4 className="text-sm font-semibold text-foreground">Complete Archive (.zip)</h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-2xs bg-warning/10 border-warning/30 text-warning font-mono"
                >
                  FULL BUNDLE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Complete archive containing all 3 ATS PDFs, .tex source, ATS JSON, evidence audit
                report, and README.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="w-full text-xs border-border gap-1.5 bg-card hover:bg-muted cursor-pointer"
            >
              <Download
                className={`w-3.5 h-3.5 text-warning ${isDownloadingZip ? 'animate-spin' : ''}`}
              />
              <span>
                {isDownloadingZip ? 'Packaging 3 PDFs & Ledger...' : 'Download .zip Package'}
              </span>
            </Button>
          </div>

          {/* 5. ATS Plain Text (.txt) */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 hover:border-border/80 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-success" />
                  <h4 className="text-sm font-semibold text-foreground">ATS Plain Text (.txt)</h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-2xs bg-success/10 border-success/30 text-success font-mono"
                >
                  ASCII TEXT
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Clean text without markup, optimized for pasting into online career application
                forms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadTxt}
                className="flex-1 text-xs border-border gap-1.5 bg-card hover:bg-muted cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(generatePlainTextResume(resumeData), 'txt')}
                className="px-2.5 text-xs border-border bg-card hover:bg-muted cursor-pointer"
                title="Copy Plain Text"
              >
                {copiedFormat === 'txt' ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* 6. Formatted Markdown (.md) */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 hover:border-border/80 transition flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-status-neutral" />
                  <h4 className="text-sm font-semibold text-foreground">Markdown Resume (.md)</h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-2xs bg-status-neutral/10 border-status-neutral/30 text-status-neutral font-mono"
                >
                  GFM MARKDOWN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Formatted markdown with headers and links. Great for GitHub profile READMEs and
                Notion.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadMarkdown}
                className="flex-1 text-xs border-border gap-1.5 bg-card hover:bg-muted cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(generateMarkdownResume(resumeData), 'md')}
                className="px-2.5 text-xs border-border bg-card hover:bg-muted cursor-pointer"
                title="Copy Markdown"
              >
                {copiedFormat === 'md' ? (
                  <Check className="w-3.5 h-3.5 text-status-neutral" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* 7. Canonical ATS JSON */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 hover:border-border/80 transition flex flex-col justify-between space-y-3 md:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-cyan" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Canonical ATS JSON (.json)
                  </h4>
                </div>
                <Badge
                  variant="outline"
                  className="text-2xs bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan font-mono"
                >
                  STANDARDIZED ATS TAXONOMY
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Standardized, structured JSON containing candidate info, work history, competencies,
                and ground-truth audit metadata.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadAtsJson}
                className="flex-1 text-xs border-border gap-1.5 bg-card hover:bg-muted cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Canonical ATS JSON</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleCopy(JSON.stringify(generateAtsJsonResume(resumeData), null, 2), 'ats_json')
                }
                className="px-3 text-xs border-border bg-card hover:bg-muted cursor-pointer gap-1.5"
                title="Copy Canonical ATS JSON"
              >
                {copiedFormat === 'ats_json' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-brand-cyan" />
                    <span className="text-brand-cyan font-mono text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="font-mono text-xs">Copy JSON</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter showCloseButton={false}>
          <DialogClose render={<Button variant="outline" size="sm" type="button" />}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
