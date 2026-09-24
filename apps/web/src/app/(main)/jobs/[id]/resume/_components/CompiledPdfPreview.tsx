'use client';

import type { ResumeData } from '@praman/schemas';
import { cn } from 'cn';
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { downloadResumePdf, fetchResumePdfBlob } from '@/hooks/usePramanApi';
import { DocumentPreviewSheet, type SheetSyncTarget } from './DocumentPreviewSheet';

interface CompiledPdfPreviewProps {
  jobId: string;
  selectedTemplate?: string;
  version?: string;
  resumeData?: ResumeData;
  candidateName?: string;
  recompileTrigger?: number;
  syncTarget?: SheetSyncTarget | null;
  onSyncToEditor?: (target: { section?: string; query?: string; timestamp: number }) => void;
}

export const CompiledPdfPreview: React.FC<CompiledPdfPreviewProps> = ({
  jobId,
  selectedTemplate = 'modern-developer',
  version,
  resumeData,
  candidateName = 'Candidate',
  recompileTrigger,
  syncTarget,
  onSyncToEditor,
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'html'>('pdf');
  const [isDownloading, setIsDownloading] = useState(false);

  const loadPdf = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const blob = await fetchResumePdfBlob(jobId, selectedTemplate, version);

      // Revoke previous URL to prevent memory leaks
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }

      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err: unknown) {
      console.error('Failed to load compiled PDF preview:', err);
      setError((err as Error)?.message || 'Failed to render PDF preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when template, version, jobId, or recompileTrigger changes
  useEffect(() => {
    loadPdf();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [jobId, selectedTemplate, version, recompileTrigger]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const safeName = (candidateName || 'Resume')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      await downloadResumePdf(
        jobId,
        selectedTemplate,
        version,
        `${safeName}_${selectedTemplate}.pdf`,
      );
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col w-full h-full space-y-3">
      {/* Top Preview Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-card border border-border shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          {/* Format Switcher: Live PDF vs HTML Sheet */}
          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setPreviewType('pdf')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                previewType === 'pdf'
                  ? 'bg-brand-cyan/15 text-brand-cyan font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Compiled PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewType('html')}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                previewType === 'html'
                  ? 'bg-brand-cyan/15 text-brand-cyan font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>HTML Sheet</span>
            </button>
          </div>

          <Badge
            variant="outline"
            className="hidden sm:inline-flex text-2xs font-mono border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan"
          >
            A4 1-PAGE DENSITY
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {previewType === 'pdf' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPdf}
                disabled={isLoading}
                className="h-7.5 text-xs border-border bg-card hover:bg-muted gap-1 cursor-pointer"
                title="Re-fetch & re-render PDF"
              >
                <RefreshCw
                  className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-brand-cyan')}
                />
                <span className="hidden sm:inline">{isLoading ? 'Compiling...' : 'Recompile'}</span>
              </Button>

              {pdfBlobUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="h-7.5 text-xs border-border bg-card hover:bg-muted gap-1 cursor-pointer"
                  title="Open compiled PDF in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pop Out</span>
                </Button>
              )}
            </>
          )}

          <Button
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-7.5 text-xs font-semibold bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark gap-1 shadow-xs cursor-pointer"
          >
            {isDownloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </Button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 w-full min-h-0 relative rounded-xl overflow-hidden border border-border bg-muted/10">
        {previewType === 'html' ? (
          <div className="w-full h-full overflow-y-auto p-4 flex justify-center items-start">
            <DocumentPreviewSheet
              resume={resumeData}
              syncTarget={syncTarget}
              onSyncToEditor={onSyncToEditor}
            />
          </div>
        ) : isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-8 bg-card/60">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                Compiling ATS PDF via Headless Chromium...
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                Rendering pixel-perfect LaTeX serif typesetting and 1-page density metrics.
              </p>
            </div>
            <Skeleton className="w-64 h-3 rounded-full bg-muted" />
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Could not render PDF preview</h4>
            <p className="text-xs text-muted-foreground max-w-md">{error}</p>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={loadPdf} className="text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewType('html')}
                className="text-xs gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Switch to HTML Sheet</span>
              </Button>
            </div>
          </div>
        ) : pdfBlobUrl ? (
          <iframe
            src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full border-none rounded-xl bg-paper shadow-inner"
            title="Live Compiled Resume PDF Preview"
          />
        ) : null}
      </div>
    </div>
  );
};
