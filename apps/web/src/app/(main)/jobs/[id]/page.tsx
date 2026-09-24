'use client';

import { AlertCircle, Layers, Sparkles } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { type PipelineStage, PipelineStepper } from '@/components/PipelineStepper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePipelineStream } from '@/hooks/usePipelineStream';
import { useJob, useRunStage } from '@/hooks/usePramanApi';
import { useUrlQueryParam, useUrlTab } from '@/hooks/useUrlParams';
import {
  JobDetailHeader,
  JobTrackerHub,
  PipelineLiveLogs,
  Stage1Structured,
  Stage2Match,
  Stage3Strategy,
  Stage4Resume,
} from './_components';

const VALID_STAGES: PipelineStage[] = ['structured', 'match', 'strategy', 'resume'];

function JobDetailSkeleton() {
  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl bg-card border border-border" />
      <Skeleton className="h-16 w-full rounded-2xl bg-card border border-border" />
      <Skeleton className="h-96 w-full rounded-2xl bg-card border border-border" />
    </div>
  );
}

function JobDetailContent() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useUrlTab<PipelineStage>({
    paramName: 'stage',
    defaultValue: 'structured',
    validValues: VALID_STAGES,
  });

  const [viewMode = 'pipeline', setViewMode] = useUrlQueryParam<'pipeline' | 'tracker'>(
    'view',
    'pipeline',
    {
      validValues: ['pipeline', 'tracker'] as const,
    },
  );

  const { data: jd, isLoading: loading, isFetching, error: fetchError, refetch } = useJob(id);
  const runStageMutation = useRunStage(id);

  const [hasAutoAdvanced, setHasAutoAdvanced] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const stage = urlParams.get('stage');
      return Boolean(stage && VALID_STAGES.includes(stage as PipelineStage));
    }
    return false;
  });
  const [manualActionError, setManualActionError] = useState<string | null>(null);

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
      setActiveTab(highestStage);
      setHasAutoAdvanced(true);
    }
  }, [jd, hasAutoAdvanced, setActiveTab]);

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
    } catch (err: unknown) {
      setManualActionError((err as Error).message);
    }
  };

  const activeError =
    manualActionError || streamError || (fetchError ? (fetchError as Error).message : null);
  const isAnyStageRunning = isStreaming || runStageMutation.isPending;

  if (loading) {
    return (
      <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl bg-card border border-border" />
        <Skeleton className="h-16 w-full rounded-2xl bg-card border border-border" />
        <Skeleton className="h-96 w-full rounded-2xl bg-card border border-border" />
      </div>
    );
  }

  const jobTelemetry = jd
    ? {
        totalTokens:
          (jd.promptTokens || 0) +
          (jd.completionTokens || 0) +
          (jd.analysis?.promptTokens || 0) +
          (jd.analysis?.completionTokens || 0) +
          (jd.analysis?.strategy?.promptTokens || 0) +
          (jd.analysis?.strategy?.completionTokens || 0) +
          (resumeRecord?.promptTokens || 0) +
          (resumeRecord?.completionTokens || 0),
        costUsd:
          (jd.costUsd || 0) +
          (jd.analysis?.costUsd || 0) +
          (jd.analysis?.strategy?.costUsd || 0) +
          (resumeRecord?.costUsd || 0),
        durationMs:
          (jd.durationMs || 0) +
          (jd.analysis?.durationMs || 0) +
          (jd.analysis?.strategy?.durationMs || 0) +
          (resumeRecord?.durationMs || 0),
        aiModel:
          resumeRecord?.aiModel ||
          jd.analysis?.strategy?.aiModel ||
          jd.analysis?.aiModel ||
          jd.aiModel ||
          null,
      }
    : null;

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <JobDetailHeader
        id={id}
        structured={structured}
        telemetry={jobTelemetry}
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

      {/* View Mode Toggle: AI Pipeline Studio vs Application & Interview Tracker */}
      <div className="flex items-center justify-between gap-4 p-1.5 rounded-2xl bg-muted/40 border border-border">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Button
            type="button"
            variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('pipeline')}
            className={`text-xs font-semibold gap-1.5 rounded-xl flex-1 sm:flex-initial transition-all ${
              viewMode === 'pipeline'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Pipeline Studio</span>
          </Button>

          <Button
            type="button"
            variant={viewMode === 'tracker' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('tracker')}
            className={`text-xs font-semibold gap-1.5 rounded-xl flex-1 sm:flex-initial transition-all ${
              viewMode === 'tracker'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Interview Hub & Tracker</span>
            {jd?.tracker?.milestones && jd.tracker.milestones.length > 0 && (
              <Badge
                variant="secondary"
                className="text-2xs px-1.5 py-0 h-4 font-mono font-bold ml-0.5"
              >
                {jd.tracker.milestones.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {viewMode === 'tracker' ? (
        <JobTrackerHub
          jobId={id}
          status={jd?.status || 'SAVED'}
          tracker={jd?.tracker}
          jobTitle={structured?.jobTitle}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={<JobDetailSkeleton />}>
      <JobDetailContent />
    </Suspense>
  );
}
