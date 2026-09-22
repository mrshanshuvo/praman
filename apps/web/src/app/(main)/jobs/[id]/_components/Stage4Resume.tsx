'use client';

import type { ResumeStatus } from '@praman/schemas';
import { ExternalLink, FileJson, FileText, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { JsonCard } from '@/components/JsonCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidationReportPanel } from '@/components/ValidationReportPanel';
import { useCandidateProfile } from '@/hooks/usePramanApi';
import { useUrlTab } from '@/hooks/useUrlParams';
import { ResumeViewer } from '../resume/_components/ResumeViewer';
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

const VALID_RESUME_VIEWS = ['structured', 'report', 'json'] as const;
type ResumeSubView = (typeof VALID_RESUME_VIEWS)[number];

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
  const { data: candidateProfile } = useCandidateProfile();
  const [activeSubTab, setActiveSubTab] = useUrlTab<ResumeSubView>({
    paramName: 'resumeView',
    defaultValue: 'structured',
    validValues: VALID_RESUME_VIEWS,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Stage 4: Generated Resume & Audit
          </h3>
          <p className="text-xs text-muted-foreground">
            Generated resume and claim verification audit.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {resumeRecord && (
            <Link
              href={`/jobs/${jobId}/resume`}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className:
                  'border-border bg-muted/60 hover:bg-muted text-foreground gap-1 flex-1 sm:flex-initial',
              })}
            >
              <span>Full Audit Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          <Button
            size="sm"
            onClick={onRun}
            disabled={isDisabled || !hasStrategy}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20 flex-1 sm:flex-initial"
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
        <Tabs
          value={activeSubTab}
          onValueChange={(val) => setActiveSubTab(val as ResumeSubView)}
          className="w-full space-y-4"
        >
          <TabsList className="bg-muted/60 p-1 border border-border">
            <TabsTrigger value="structured" className="text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Interactive Audit View</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-pink" />
              <span>Validation Rules</span>
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Raw JSON</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structured">
            <ResumeViewer
              resume={resumeJson}
              validationReport={validationReport}
              candidateProfile={candidateProfile}
            />
          </TabsContent>

          <TabsContent value="report">
            <ValidationReportPanel report={validationReport} status={resumeStatus} />
          </TabsContent>

          <TabsContent value="json">
            <JsonCard title="Final Resume JSON" subtitle="Schema: ResumeSchema" data={resumeJson} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
