'use client';

import { AlertCircle } from 'lucide-react';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { type PipelineStage, PipelineStepper } from '@/components/PipelineStepper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePipelineStream } from '@/hooks/usePipelineStream';
import { useJob, useRunStage } from '@/hooks/usePramanApi';
import { JobDetailHeader } from './_components/JobDetailHeader';
import { PipelineLiveLogs } from './_components/PipelineLiveLogs';
import { Stage1Structured } from './_components/Stage1Structured';
import { Stage2Match } from './_components/Stage2Match';
import { Stage3Strategy } from './_components/Stage3Strategy';
import { Stage4Resume } from './_components/Stage4Resume';

const VALID_STAGES: PipelineStage[] = ['structured', 'match', 'strategy', 'resume'];

export default function JobDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const id = params.id as string;

  const stageFromUrl = searchParams.get('stage') as PipelineStage | null;
  const initialStage = stageFromUrl && VALID_STAGES.includes(stageFromUrl) ? stageFromUrl : null;

  const { data: jd, isLoading: loading, isFetching, error: fetchError, refetch } = useJob(id);
  const runStageMutation = useRunStage(id);

  const [activeTab, setActiveTabState] = useState<PipelineStage>(initialStage || 'structured');
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState<boolean>(Boolean(initialStage));
  const [manualActionError, setManualActionError] = useState<string | null>(null);

  const setActiveTab = useCallback(
    (stage: PipelineStage) => {
      setActiveTabState(stage);
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('stage', stage);
        window.history.replaceState(null, '', `${pathname}?${urlParams.toString()}`);
      }
    },
    [pathname],
  );

  // Auto-advance to highest completed stage on first load if no URL stage was provided
  useEffect(() => {
    if (!hasAutoAdvanced && jd) {
      let highestStage: PipelineStage = 'structured';
      if (jd.analysis?.strategy?.resume?.resumeJson) {
        highestStage = 'resume';
      } else if (jd.analysis?.strategy?.result) {
        highestStage = 'strategy';
      } else if (jd.analysis?.result) {
        highestStage = 'match';
      }
      setActiveTabState(highestStage);
      setHasAutoAdvanced(true);
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('stage', highestStage);
        window.history.replaceState(null, '', `${pathname}?${urlParams.toString()}`);
      }
    }
  }, [jd, hasAutoAdvanced, pathname]);

  const {
    isStreaming,
    stageStatuses,
    liveLogs,
    error: streamError,
    startStream,
    cancelStream,
  } = usePipelineStream(id, {
    onStageChange: (stage) => setActiveTab(stage),
    onComplete: () => setActiveTab('resume'),
  });

  const structured = jd?.structured;
  const analysis = jd?.analysis?.result;
  const strategy = jd?.analysis?.strategy?.result;
  const resumeRecord = jd?.analysis?.strategy?.resume;
  const resumeJson = resumeRecord?.resumeJson;
  const validationReport = resumeRecord?.validationReport;
  const resumeStatus = resumeRecord?.status;

  const completedStages: PipelineStage[] = [];
  if (structured) completedStages.push('structured');
  if (analysis) completedStages.push('match');
  if (strategy) completedStages.push('strategy');
  if (resumeJson) completedStages.push('resume');

  const runStage = async (stage: 'match' | 'strategy' | 'resume') => {
    setManualActionError(null);
    try {
      await runStageMutation.mutateAsync(stage);
      setActiveTab(stage);
    } catch (err: any) {
      setManualActionError(err.message);
    }
  };

  const activeError =
    manualActionError || streamError || (fetchError ? (fetchError as Error).message : null);
  const isAnyStageRunning = isStreaming || runStageMutation.isPending;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl bg-card border border-border" />
        <Skeleton className="h-16 w-full rounded-2xl bg-card border border-border" />
        <Skeleton className="h-96 w-full rounded-2xl bg-card border border-border" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <JobDetailHeader
        id={id}
        structured={structured}
        isFetching={isFetching}
        isStreaming={isStreaming}
        onRefresh={() => refetch()}
        onRunPipeline={startStream}
        onCancelStream={cancelStream}
      />

      {activeError && (
        <Alert
          variant="destructive"
          className="flex items-center justify-between border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-pink shrink-0" />
            <AlertDescription className="text-xs text-brand-pink">{activeError}</AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs border-brand-pink/40 text-brand-pink hover:bg-brand-pink/20 hover:text-brand-light shrink-0"
          >
            Retry
          </Button>
        </Alert>
      )}

      <PipelineStepper
        currentStage={activeTab}
        completedStages={completedStages}
        stageStatuses={stageStatuses}
        onSelectStage={(stage) => setActiveTab(stage)}
        isLoading={isAnyStageRunning}
      />

      <PipelineLiveLogs logs={liveLogs} isStreaming={isStreaming} />

      <div className="space-y-6">
        {activeTab === 'structured' && <Stage1Structured structured={structured} />}
        {activeTab === 'match' && (
          <Stage2Match
            analysis={analysis}
            structured={structured}
            isRunning={isStreaming || runStageMutation.isPending}
            isDisabled={isAnyStageRunning}
            onRun={() => runStage('match')}
          />
        )}
        {activeTab === 'strategy' && (
          <Stage3Strategy
            strategy={strategy}
            hasAnalysis={!!analysis}
            isRunning={isStreaming || runStageMutation.isPending}
            isDisabled={isAnyStageRunning}
            onRun={() => runStage('strategy')}
          />
        )}
        {activeTab === 'resume' && (
          <Stage4Resume
            jobId={id}
            resumeJson={resumeJson}
            validationReport={validationReport}
            resumeStatus={resumeStatus}
            resumeRecord={resumeRecord}
            hasStrategy={!!strategy}
            isRunning={isStreaming || runStageMutation.isPending}
            isDisabled={isAnyStageRunning}
            onRun={() => runStage('resume')}
          />
        )}
      </div>
    </div>
  );
}
