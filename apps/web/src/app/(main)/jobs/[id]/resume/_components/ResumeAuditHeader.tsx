'use client';

import { cn } from 'cn';
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileDown,
  GitCompare,
  History,
  Play,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { MatchScoreBadge } from '@/components/MatchScoreBadge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { downloadResumePdf, fetchResumePdfBlob } from '@/hooks/usePramanApi';
import {
  generateAtsJsonResume,
  generateMarkdownResume,
  generatePlainTextResume,
} from '@/lib/plainTextResume';
import { downloadZip, triggerFileDownload } from '@/lib/zip';
import { ExportSuiteModal } from './ExportSuiteModal';

interface ResumeAuditHeaderProps {
  id: string;
  status?: string;
  downloadUrl?: string | null;
  resumeJson: any;
  latexCode?: string;
  templateId?: string;
  matchAnalysis?: any;
  isFetching: boolean;
  isRegenerating: boolean;
  onRefresh: () => void;
  onRegenerate: () => void;
  versions?: any[];
  selectedVersion?: string;
  onSelectVersion?: (version: string) => void;
  currentVersion?: number;
  validationReport?: any;
  onOpenDiff?: () => void;
  onOpenAudit?: () => void;
}

export const ResumeAuditHeader: React.FC<ResumeAuditHeaderProps> = ({
  id,
  status,
  downloadUrl,
  resumeJson,
  latexCode = '',
  templateId = 'modern-developer',
  matchAnalysis,
  isFetching,
  isRegenerating,
  onRefresh,
  onRegenerate,
  versions,
  selectedVersion,
  onSelectVersion,
  currentVersion,
  validationReport,
  onOpenDiff,
  onOpenAudit,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const safeFilenameBase = (resumeJson?.personal?.name || 'Resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadResumePdf(
        id,
        templateId,
        selectedVersion,
        `${safeFilenameBase}_${templateId}.pdf`,
      );
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadTex = () => {
    triggerFileDownload(`${safeFilenameBase}_${templateId}.tex`, latexCode, 'application/x-tex');
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      const plainText = generatePlainTextResume(resumeJson);
      const markdown = generateMarkdownResume(resumeJson);
      const atsJson = JSON.stringify(generateAtsJsonResume(resumeJson), null, 2);
      const rawJson = JSON.stringify(resumeJson, null, 2);
      const reportJson = validationReport ? JSON.stringify(validationReport, null, 2) : null;

      const readme = `# ${resumeJson?.personal?.name || 'Candidate'} — Tailored Resume Package
This archive contains your tailored, audited resume generated deterministically by Praman.

## Included ATS Resume PDF Styling Variants:
1. **resume_modern-developer.pdf**: Clean Helvetica/Inter sans-serif, high-contrast dark typography (#000000), deep navy (#004F90) link accents, square bullet highlights.
2. **resume_classic-academic.pdf**: Traditional Computer Modern / Latin Modern Roman serif, small-caps section headings, academic rules.
3. **resume_compact-executive.pdf**: Ultra-dense executive layout, bold leadership headers, tight margins maximizing 1-page capacity.

## Source & Data Files:
- **resume.tex**: Raw LaTeX source code.
- **resume_ats.json**: Standardized ATS-ready canonical JSON resume.
- **resume_evidence.json**: Ground-truth cross-reference ledger linking each bullet to verified records.
- **validation_report.json**: Claim verification audit report.
- **resume.txt**: Clean ASCII text for online job application textareas.
- **resume.md**: Markdown format for portfolios and developer documentation.

## Local Compilation:
\`\`\`bash
pdflatex resume.tex
\`\`\`
Or upload this package directly to Overleaf (New Project -> Upload Project).
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

      // Fetch all 3 PDF styling variants in parallel
      const templates = ['modern-developer', 'classic-academic', 'compact-executive'];
      const pdfResults = await Promise.allSettled(
        templates.map(async (tmpl) => {
          const blob = await fetchResumePdfBlob(id, tmpl, selectedVersion);
          const arrayBuffer = await blob.arrayBuffer();
          return { tmpl, data: new Uint8Array(arrayBuffer) };
        }),
      );

      for (const res of pdfResults) {
        if (res.status === 'fulfilled') {
          files[`resume_${res.value.tmpl}.pdf`] = res.value.data;
        }
      }

      downloadZip(`${safeFilenameBase}_complete_package.zip`, files);
    } catch (err) {
      console.error('Failed to generate complete ZIP package:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleOpenOverleaf = () => {
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

  const handleCopyJson = () => {
    if (!resumeJson) return;
    navigator.clipboard.writeText(JSON.stringify(resumeJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidated = status === 'VALIDATED';

  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Column: Navigation, Title & Metadata Badges */}
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${id}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'icon',
              className:
                'border-border bg-card text-muted-foreground hover:text-foreground h-9 w-9 shrink-0',
            })}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Resume Studio
              </h1>
              {onOpenAudit ? (
                <button
                  type="button"
                  onClick={onOpenAudit}
                  className={cn(
                    'text-xs font-mono font-bold px-2.5 py-1 uppercase rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs',
                    isValidated
                      ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20'
                      : 'bg-brand-pink/10 border-brand-pink/30 text-brand-pink hover:bg-brand-pink/20',
                  )}
                  title="Click to view full Evidence Audit Report modal"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{status || 'DRAFT'}</span>
                  <span className="text-2xs font-sans font-medium opacity-75">· Audit</span>
                </button>
              ) : (
                <Badge
                  variant="outline"
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 uppercase ${
                    isValidated
                      ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'
                      : 'bg-brand-pink/10 border-brand-pink/30 text-brand-pink'
                  }`}
                >
                  {status || 'DRAFT'}
                </Badge>
              )}

              {/* Version Selector */}
              {versions && versions.length > 1 ? (
                <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-lg border border-border">
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Ver:</span>
                  <select
                    value={
                      selectedVersion ||
                      versions.find((v) => v.isLatest)?.version?.toString() ||
                      '1'
                    }
                    onChange={(e) => onSelectVersion?.(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    {versions.map((v: any) => (
                      <option
                        key={v.id}
                        value={v.version?.toString()}
                        className="bg-card text-foreground"
                      >
                        v{v.version} {v.isLatest ? '(Latest)' : ''}
                      </option>
                    ))}
                  </select>
                  {onOpenDiff && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenDiff}
                      className="h-6 px-1.5 text-2xs font-medium text-warning hover:text-warning/90 hover:bg-warning/15 gap-1 cursor-pointer ml-1 rounded border border-warning/25"
                      title="Compare versions diff"
                    >
                      <GitCompare className="w-3 h-3" />
                      <span>Diff</span>
                    </Button>
                  )}
                </div>
              ) : currentVersion ? (
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-muted-foreground border-border bg-muted/50 px-2 py-0.5"
                >
                  v{currentVersion}
                </Badge>
              ) : null}

              {matchAnalysis && <MatchScoreBadge analysis={matchAnalysis} variant="pill" />}
            </div>
          </div>
        </div>

        {/* Right Column: Clear Action Hierarchy */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Tier 3: Utility Group (Icon-only with tooltips) */}
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-0.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={isFetching || isRegenerating}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Refresh resume data"
                  />
                }
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </TooltipTrigger>
              <TooltipContent>Refresh status & audit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyJson}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label="Copy resume JSON"
                  />
                }
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-brand-cyan" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Copied JSON payload!' : 'Copy verified JSON payload'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Tier 2: Pipeline Action */}
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="border-border bg-card hover:bg-muted text-foreground font-medium gap-1.5 cursor-pointer h-9"
          >
            {isRegenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-cyan" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-muted-foreground" />
            )}
            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </Button>

          {/* Tier 1: Primary Split Action Button */}
          <div className="inline-flex rounded-lg shadow-xs">
            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold gap-1.5 rounded-r-none border-r border-brand-dark/20 cursor-pointer h-9 px-3.5"
            >
              {isDownloadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-dark" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'Generating...' : 'Download PDF'}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size="sm"
                    disabled={isDownloadingPdf}
                    className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark px-2 rounded-l-none cursor-pointer h-9"
                    aria-label="Export options"
                  />
                }
              >
                <ChevronDown className="w-3.5 h-3.5 text-brand-dark" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Direct Exports</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleDownloadPdf}>
                  <FileDown className="w-4 h-4 text-brand-cyan" />
                  <span>ATS Resume PDF (.pdf)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip}
                  className="cursor-pointer"
                >
                  <Archive
                    className={`w-4 h-4 text-warning ${isDownloadingZip ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isDownloadingZip ? 'Packaging 3 PDFs...' : 'Complete Package (.zip)'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadTex}>
                  <FileCode className="w-4 h-4 text-brand-cyan" />
                  <span>LaTeX Source (.tex)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenOverleaf}>
                  <ExternalLink className="w-4 h-4 text-brand-pink" />
                  <span>Open in Overleaf</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsExportOpen(true)}>
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span>All Export Formats...</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Full Detailed Export Modal */}
        <ExportSuiteModal
          isOpen={isExportOpen}
          onOpenChange={setIsExportOpen}
          resumeData={resumeJson}
          latexCode={latexCode}
          templateId={templateId}
          downloadUrl={downloadUrl}
          candidateName={resumeJson?.personal?.name}
          jobId={id}
          version={selectedVersion}
          validationReport={validationReport}
        />
      </div>
    </TooltipProvider>
  );
};
