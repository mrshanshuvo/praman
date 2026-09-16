'use client';

import type { ResumeStatus } from '@praman/schemas';
import { ExternalLink, Play, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { JsonCard } from '@/components/JsonCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { ValidationReportPanel } from '@/components/ValidationReportPanel';
import { StageEmpty } from './StageEmpty';

interface Stage4ResumeProps {
  jobId: string;
  resumeJson: any;
  validationReport: any;
  resumeStatus: ResumeStatus | undefined;
  resumeRecord: any;
  hasStrategy: boolean;
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
}

export function Stage4Resume({
  jobId,
  resumeJson,
  validationReport,
  resumeStatus,
  resumeRecord,
  hasStrategy,
  isRunning,
  isDisabled,
  onRun,
}: Stage4ResumeProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Stage 4: Generated Resume & Audit
          </h3>
          <p className="text-xs text-muted-foreground">
            Truth-preserving resume generation with 2-layer deterministic validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {resumeRecord && (
            <Link
              href={`/jobs/${jobId}/resume`}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'border-border bg-muted/60 hover:bg-muted text-foreground gap-1',
              })}
            >
              <span>Full Audit View</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          <Button
            size="sm"
            onClick={onRun}
            disabled={isDisabled || !hasStrategy}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-brand-dark" />
            )}
            <span>{resumeJson ? 'Regenerate Resume' : 'Run Stage 4'}</span>
          </Button>
        </div>
      </div>

      {!resumeJson ? (
        <StageEmpty
          message={
            !hasStrategy
              ? 'Please run Stage 3 (Resume Strategy) before generating resume.'
              : 'Resume has not been generated yet.'
          }
          ctaLabel={hasStrategy ? 'Generate & Validate Resume Now' : undefined}
          onCta={hasStrategy ? onRun : undefined}
        />
      ) : (
        <div className="space-y-6">
          <ValidationReportPanel report={validationReport} status={resumeStatus} />
          <JsonCard title="Final Resume JSON" subtitle="Schema: ResumeSchema" data={resumeJson} />
        </div>
      )}
    </div>
  );
}
