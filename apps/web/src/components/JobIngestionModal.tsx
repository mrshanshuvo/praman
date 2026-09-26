'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreateJob } from '@/hooks/usePramanApi';

export interface DuplicateJdInfo {
  id: string | null;
  jobTitle?: string | null;
  matchScore?: number | null;
}

interface JobIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultText?: string;
}

export function JobIngestionModal({ isOpen, onClose, defaultText }: JobIngestionModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [rawText, setRawText] = useState(defaultText || '');
  const [createdJd, setCreatedJd] = useState<JobDescriptionRecord | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateJdInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const createJobMutation = useCreateJob();
  const loading = createJobMutation.isPending;

  useEffect(() => {
    if (defaultText) {
      setRawText(defaultText);
    }
  }, [defaultText]);

  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const isReady = rawText.trim().length >= 10;

  const resetForm = () => {
    setRawText('');
    setCreatedJd(null);
    setDuplicateInfo(null);
    setActionError(null);
    setPasteSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      }
    } catch {
      // Clipboard API restricted by browser permission
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || rawText.length < 10) {
      setActionError('Job description must be at least 10 characters long');
      return;
    }
    setActionError(null);
    setDuplicateInfo(null);
    try {
      const data = await createJobMutation.mutateAsync({ rawText });
      setCreatedJd(data);
    } catch (err: unknown) {
      const error = err as {
        data?: { code?: string; existingJd?: DuplicateJdInfo };
        status?: number;
        message?: string;
      } | null;
      if (error?.data?.code === 'DUPLICATE_JD' || error?.status === 409) {
        setDuplicateInfo(error.data?.existingJd || { id: null });
      } else {
        setActionError(error?.message || 'An error occurred while analyzing the job description');
      }
    }
  };

  const handleForceSubmit = async () => {
    setActionError(null);
    setDuplicateInfo(null);
    try {
      const data = await createJobMutation.mutateAsync({ rawText, force: true });
      setCreatedJd(data);
    } catch (err: unknown) {
      const error = err as { message?: string } | null;
      setActionError(error?.message || 'An error occurred while analyzing the job description');
    }
  };

  const handleLaunchPipeline = () => {
    if (createdJd?.id) {
      handleClose();
      router.push(`/jobs/${createdJd.id}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[85vh] w-full flex flex-col bg-card border-border shadow-2xl p-6 rounded-2xl overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Target Job Description Ingestion
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Paste a target job posting to extract verified requirements and launch your
                pipeline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {createdJd ? (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <h4 className="text-sm font-bold text-foreground">
                  Job Description Extracted Successfully
                </h4>
                <p className="text-xs text-muted-foreground">
                  Deterministic schema requirements, seniority tier, and core technical skills have
                  been parsed.
                </p>
                <div className="pt-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-card text-foreground font-semibold text-xs border-border"
                  >
                    {createdJd.structured?.jobTitle || 'Target Position'}
                  </Badge>
                  {createdJd.structured?.company && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                      {createdJd.structured.company}
                    </Badge>
                  )}
                  {createdJd.structured?.seniority && (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/30 text-xs"
                    >
                      {createdJd.structured.seniority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="w-full sm:w-auto text-xs border-border cursor-pointer"
              >
                Ingest Another
              </Button>
              <Button
                size="sm"
                onClick={handleLaunchPipeline}
                className="w-full sm:w-auto text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Launch Tailoring Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 pt-3">
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {actionError && (
                <Alert variant="destructive" className="py-2.5 rounded-xl shrink-0">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs">{actionError}</AlertDescription>
                </Alert>
              )}

              {duplicateInfo && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 shrink-0">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground space-y-1">
                      <p className="font-semibold">Duplicate Job Description Detected</p>
                      <p className="text-muted-foreground text-2xs">
                        This posting was previously analyzed as{' '}
                        <span className="font-medium text-foreground">
                          {duplicateInfo.jobTitle || 'Target Role'}
                        </span>
                        {duplicateInfo.matchScore != null && (
                          <span> (Match Score: {duplicateInfo.matchScore}%)</span>
                        )}
                        .
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {duplicateInfo.id && (
                      <Link
                        href={`/jobs/${duplicateInfo.id}`}
                        onClick={handleClose}
                        className="text-2xs text-primary hover:underline font-semibold"
                      >
                        View Existing Job ➔
                      </Link>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={handleForceSubmit}
                      disabled={loading}
                      className="ml-auto text-2xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                    >
                      Force Ingest Anyway
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <div className="flex items-center justify-between shrink-0">
                  <label
                    htmlFor="modal-jd-textarea"
                    className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Job Description Content</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={handlePasteFromClipboard}
                      className="h-6 px-2 text-2xs border-border bg-card hover:bg-muted text-foreground cursor-pointer gap-1"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="w-3 h-3 text-primary" />
                      <span>{pasteSuccess ? 'Pasted!' : 'Paste Clipboard'}</span>
                    </Button>
                    {rawText.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setRawText('')}
                        disabled={loading}
                        className="h-6 px-2 text-2xs text-muted-foreground hover:text-destructive cursor-pointer gap-1"
                        title="Clear content"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea
                  id="modal-jd-textarea"
                  required
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isReady && !loading) {
                      e.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  placeholder="Paste the target job description here (responsibilities, technical skills, requirements)..."
                  className="w-full flex-1 min-h-55 max-h-[46vh] bg-background/50 border-border/80 rounded-xl p-3.5 text-xs text-foreground font-mono focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary leading-relaxed resize-none overflow-y-auto"
                />
              </div>
            </div>

            {/* Pinned Footer with stats and submission */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-border shrink-0">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="font-mono">
                  <strong className="text-foreground">{rawText.length}</strong> chars
                </span>
                <span className="text-border">•</span>
                <span className="font-mono">
                  <strong className="text-foreground">{wordCount}</strong> words
                </span>
                <span className="text-border">•</span>
                {isReady ? (
                  <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground/70 text-2xs">Min 10 chars</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={loading}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !isReady}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting Schema...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Analyze Job Description</span>
                      <kbd className="hidden sm:inline-flex items-center text-2xs bg-primary-foreground/20 text-primary-foreground px-1 py-0.5 rounded font-mono font-normal">
                        ⌘↵
                      </kbd>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
