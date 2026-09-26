'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import { Building2, FileText, Loader2, Pencil, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useJob, useUpdateJobMeta } from '@/hooks/usePramanApi';

interface EditJobMetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jd: JobDescriptionRecord | null;
}

interface FormInnerProps {
  jd: JobDescriptionRecord;
  onClose: () => void;
}

function extractCompany(structuredCompany?: string | null, rawText?: string | null): { value: string; isAutoDetected: boolean } {
  if (structuredCompany?.trim()) {
    return { value: structuredCompany.trim(), isAutoDetected: false };
  }
  const match = rawText?.match(/(?:Company|Organization|Employer):\s*([^\n\r]+)/i);
  if (match?.[1]?.trim()) {
    return { value: match[1].trim(), isAutoDetected: true };
  }
  return { value: '', isAutoDetected: false };
}

function EditJobMetaForm({ jd, onClose }: FormInnerProps) {
  const structured = jd.structured || {};
  const initialCompany = extractCompany(structured.company, jd.rawText);

  const [jobTitle, setJobTitle] = useState(structured.jobTitle || '');
  const [company, setCompany] = useState(initialCompany.value);
  const [rawText, setRawText] = useState(jd.rawText || '');
  const [showRawText, setShowRawText] = useState(false);
  const [reanalyze, setReanalyze] = useState(false);

  const updateMetaMutation = useUpdateJobMeta();

  const rawTextChanged = showRawText && rawText.trim() !== (jd.rawText || '').trim();
  const isDirty =
    jobTitle.trim() !== (structured.jobTitle || '').trim() ||
    company.trim() !== (structured.company || '').trim() ||
    rawTextChanged ||
    reanalyze;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = jobTitle.trim();
    if (!trimmedTitle) {
      toast.error('Job title cannot be empty');
      return;
    }

    try {
      const willReanalyze = showRawText && reanalyze && rawText.trim().length >= 10;
      await updateMetaMutation.mutateAsync({
        id: jd.id,
        data: {
          jobTitle: trimmedTitle,
          company: company.trim() || null,
          ...(showRawText && rawText.trim().length >= 10 ? { rawText: rawText.trim() } : {}),
          ...(willReanalyze ? { reanalyze: true } : {}),
        },
      });
      toast.success(
        willReanalyze
          ? 'Job details updated & re-analyzed with AI'
          : 'Job details updated',
      );
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update job details');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isDirty && jobTitle.trim() && !updateMetaMutation.isPending) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col flex-1 min-h-0 gap-4"
    >
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3.5">
        <div className="space-y-1.5">
          <label htmlFor="edit-job-title" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5 text-brand-cyan" />
            Job Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="edit-job-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            required
            className="text-sm bg-muted/40 border-border focus:border-brand-cyan"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="edit-company-name" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              Company Name
            </label>
            {initialCompany.isAutoDetected && company === initialCompany.value && (
              <span className="text-[10px] font-medium text-brand-cyan bg-brand-cyan/10 px-1.5 py-0.5 rounded border border-brand-cyan/20">
                Suggested from JD
              </span>
            )}
          </div>
          <Input
            id="edit-company-name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Stripe, Linear, Remote"
            className="text-sm bg-muted/40 border-border focus:border-brand-cyan"
          />
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="text-xs font-medium text-brand-cyan hover:underline flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3 h-3" />
            {showRawText ? 'Hide Job Description text' : 'Edit raw Job Description text'}
          </button>

          {showRawText && (
            <div className="mt-2 space-y-2 animate-in fade-in-50 duration-150">
              <Textarea
                id="edit-raw-text"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (!reanalyze) setReanalyze(true);
                }}
                placeholder="Paste or edit the full job description text..."
                className="text-xs font-mono bg-muted/30 border-border resize-y leading-relaxed min-h-35 max-h-65 overflow-y-auto"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Minimum 10 characters required if editing raw text.</span>
                <span>{rawText.length} characters</span>
              </div>

              {rawText.trim().length >= 10 && (
                <label
                  htmlFor="reanalyze-checkbox"
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 text-xs text-foreground cursor-pointer select-none hover:bg-brand-cyan/15 transition-colors"
                >
                  <input
                    type="checkbox"
                    id="reanalyze-checkbox"
                    checked={reanalyze}
                    onChange={(e) => setReanalyze(e.target.checked)}
                    className="mt-0.5 rounded accent-brand-cyan size-3.5 cursor-pointer"
                  />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-brand-cyan">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Re-analyze structured requirements with AI</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Automatically extracts updated skills, responsibilities, and seniority tier from the new text.
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="pt-3 gap-2 sm:gap-0 shrink-0 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={updateMetaMutation.isPending}
          className="text-xs border-border"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={updateMetaMutation.isPending || !jobTitle.trim() || !isDirty}
          className="text-xs bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold gap-1.5 shadow-sm shadow-brand-cyan/20 disabled:opacity-50"
        >
          {updateMetaMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{showRawText && reanalyze ? 'Re-analyzing with AI...' : 'Saving...'}</span>
            </>
          ) : showRawText && reanalyze ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save & Re-analyze</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function EditJobMetaContainer({
  initialJd,
  onClose,
}: {
  initialJd: JobDescriptionRecord;
  onClose: () => void;
}) {
  const { data: fullJd } = useJob(initialJd.id);
  const jd = fullJd || initialJd;

  return (
    <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col bg-card border-border shadow-2xl p-6 gap-4 overflow-hidden">
      <DialogHeader className="p-0 gap-1 text-left shrink-0">
        <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Pencil className="w-4 h-4 text-brand-cyan" />
          Edit Job Information
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
          Update the title, company, or job description details. Changes reflect across your tracker and resumes.
        </DialogDescription>
      </DialogHeader>

      <EditJobMetaForm
        key={`${jd.id}-${jd.rawText?.length || 0}`}
        jd={jd}
        onClose={onClose}
      />
    </DialogContent>
  );
}

export function EditJobMetaModal({ open, onOpenChange, jd }: EditJobMetaModalProps) {
  if (!jd) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditJobMetaContainer
        key={`${jd.id}-${open}`}
        initialJd={jd}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
