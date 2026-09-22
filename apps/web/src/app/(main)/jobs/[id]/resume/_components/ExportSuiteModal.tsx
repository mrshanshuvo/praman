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
import {
  downloadCompleteResumeZip,
  downloadJson,
  downloadLatex,
  downloadMarkdown,
  downloadResumePdf,
  downloadText,
  openInOverleaf,
  sanitizeFilename,
} from '@/lib/export-manager';
import {
  generateAtsJsonResume,
  generateMarkdownResume,
  generatePlainTextResume,
} from '@/lib/plainTextResume';

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

  const safeFilenameBase = sanitizeFilename(candidateName, 'Candidate');

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
    downloadLatex(`${safeFilenameBase}_${templateId}.tex`, latexCode);
  };

  const handleDownloadTxt = () => {
    const plainText = generatePlainTextResume(resumeData);
    downloadText(`${safeFilenameBase}_resume.txt`, plainText);
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdownResume(resumeData);
    downloadMarkdown(`${safeFilenameBase}_resume.md`, markdown);
  };

  const handleDownloadAtsJson = () => {
    const atsObj = generateAtsJsonResume(resumeData);
    downloadJson(`${safeFilenameBase}_ats_resume.json`, atsObj);
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      await downloadCompleteResumeZip({
        candidateName,
        templateId,
        templateName: templateInfo.name,
        latexCode,
        resumeJson: resumeData,
        validationReport,
        jobId,
        version,
      });
    } catch (err) {
      console.error('Failed to download complete zip bundle:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleOpenOverleaf = () => {
    openInOverleaf(latexCode);
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
              className="w-full bg-brand-pink hover:bg-brand-pink/90 text-brand-light font-semibold text-xs gap-1.5 shadow-xs cursor-pointer"
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
