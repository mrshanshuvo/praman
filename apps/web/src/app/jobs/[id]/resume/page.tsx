'use client';

import { ArrowLeft, Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ValidationReportPanel } from '@/components/ValidationReportPanel';
import { useJobResume } from '@/hooks/usePramanApi';
import { ResumeViewer } from './_components/ResumeViewer';

export default function ResumeAuditPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    data: resumeData,
    isLoading: loading,
    isFetching,
    error: fetchError,
    refetch,
  } = useJobResume(id);
  const [copied, setCopied] = useState(false);
  const error = fetchError ? (fetchError as Error).message : null;

  const resume = resumeData?.resumeJson;
  const report = resumeData?.validationReport;
  const status = resumeData?.status;

  const handleCopyJson = () => {
    if (!resume) return;
    navigator.clipboard.writeText(JSON.stringify(resume, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-64 bg-muted" />
                <Skeleton className="h-5 w-20 rounded-full bg-muted" />
              </div>
              <Skeleton className="h-3.5 w-80 bg-muted/60" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded bg-muted" />
            <Skeleton className="h-9 w-28 rounded bg-muted" />
          </div>
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-8 rounded-2xl border border-border bg-card/60 space-y-6">
              <div className="space-y-2 border-b border-border pb-4">
                <Skeleton className="h-8 w-48 bg-muted" />
                <Skeleton className="h-4 w-72 bg-muted/60" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-32 bg-muted" />
                <Skeleton className="h-16 w-full bg-muted/40" />
              </div>
              <div className="space-y-3 pt-2">
                <Skeleton className="h-5 w-40 bg-muted" />
                <Skeleton className="h-24 w-full bg-muted/40" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl border border-border bg-card/60 space-y-4">
              <Skeleton className="h-5 w-44 bg-muted" />
              <Skeleton className="h-20 w-full rounded-xl bg-muted/50" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-10 w-full rounded-lg bg-muted/30" />
                <Skeleton className="h-10 w-full rounded-lg bg-muted/30" />
                <Skeleton className="h-10 w-full rounded-lg bg-muted/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-foreground mb-2">
          Resume Not Found or Not Generated
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          {error || 'Stage 4 has not been run for this job description yet.'}
        </p>
        <Link
          href={`/jobs/${id}`}
          className={buttonVariants({
            size: 'sm',
            className:
              'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20',
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Pipeline</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/jobs/${id}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'icon',
              className:
                'border-border bg-card text-muted-foreground hover:text-foreground h-9 w-9',
            })}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Resume & Evidence Audit
              </h1>
              <Badge
                variant="outline"
                className={`text-xs font-mono font-bold px-2.5 py-0.5 uppercase ${
                  status === 'VALIDATED'
                    ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'
                    : 'bg-brand-pink/10 border-brand-pink/30 text-brand-pink'
                }`}
              >
                {status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Audited against confirmed candidate profile records with zero hallucinations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-foreground border-border bg-card hover:bg-muted"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyJson}
            className="text-foreground border-border bg-card hover:bg-muted"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand-cyan" />
                <span className="text-brand-cyan">Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid: Left = Formatted Resume, Right = Audit Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <ResumeViewer resume={resume} />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-cyan" />
              Evidence Cross-Check Audit
            </h3>
            <ValidationReportPanel report={report} status={status} />
          </div>
        </div>
      </div>
    </div>
  );
}
