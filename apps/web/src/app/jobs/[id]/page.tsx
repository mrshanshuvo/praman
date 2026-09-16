'use client';

import { AlertCircle, Play, RefreshCw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { type PipelineStage, PipelineStepper } from '@/components/PipelineStepper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useJob, useRunFullPipeline, useRunStage } from '@/hooks/usePramanApi';
import { Stage1Structured } from './_components/Stage1Structured';
import { Stage2Match } from './_components/Stage2Match';
import { Stage3Strategy } from './_components/Stage3Strategy';
import { Stage4Resume } from './_components/Stage4Resume';

export default function JobDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const id = params.id as string;

  const { data: jd, isLoading: loading, isFetching, error: fetchError, refetch } = useJob(id);
  const runStageMutation = useRunStage(id);
  const runFullPipelineMutation = useRunFullPipeline(id);

  const [activeTab, setActiveTab] = useState<PipelineStage>('structured');
  const [actionError, setActionError] = useState<string | null>(null);

  const error = actionError || (fetchError ? (fetchError as Error).message : null);
  const runningStep = runFullPipelineMutation.isPending
    ? 'pipeline'
    : runStageMutation.isPending
      ? (runStageMutation.variables ?? null)
      : null;

  // Stage outputs
  const structured = jd?.structured;
  const analysis = jd?.analysis?.result;
  const strategy = jd?.analysis?.strategy?.result;
  const resumeRecord = jd?.analysis?.strategy?.resume;
  const resumeJson = resumeRecord?.resumeJson;
  const validationReport = resumeRecord?.validationReport;
  const resumeStatus = resumeRecord?.status;

  // Determine completed stages
  const completedStages: PipelineStage[] = [];
  if (structured) completedStages.push('structured');
  if (analysis) completedStages.push('match');
  if (strategy) completedStages.push('strategy');
  if (resumeJson) completedStages.push('resume');

  const runStage = async (stage: 'match' | 'strategy' | 'resume') => {
    setActionError(null);
    try {
      await runStageMutation.mutateAsync(stage);
      setActiveTab(stage);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const runFullPipeline = async () => {
    setActionError(null);
    try {
      await runFullPipelineMutation.mutateAsync();
      setActiveTab('resume');
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Skeleton */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded bg-muted" />
              <Skeleton className="h-7 w-64 bg-muted" />
            </div>
            <Skeleton className="h-4 w-48 bg-muted/60" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded bg-muted" />
            <Skeleton className="h-9 w-36 rounded bg-muted" />
          </div>
        </div>

        {/* Stepper Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl bg-card border border-border" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
          <Skeleton className="h-6 w-48 bg-muted" />
          <Skeleton className="h-4 w-full bg-muted/50" />
          <Skeleton className="h-4 w-3/4 bg-muted/50" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Skeleton className="h-32 rounded-xl bg-muted/40" />
            <Skeleton className="h-32 rounded-xl bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-border bg-card/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <Badge
              variant="outline"
              className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border-border"
            >
              JD #{id.slice(0, 8)}
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {structured?.jobTitle || 'Target Job Role'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
            {structured?.seniority && <span>Level: {structured.seniority}</span>}
            {structured?.locationOrWorkMode && <span>• {structured.locationOrWorkMode}</span>}
            {structured?.yearsOfExperience && <span>• {structured.yearsOfExperience}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-foreground border-border bg-card hover:bg-muted"
            title="Refresh job data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={runFullPipeline}
            disabled={runningStep !== null}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-sm shadow-brand-cyan/20 w-full sm:w-auto"
          >
            {runningStep === 'pipeline' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Pipeline (Stages 2→4)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-brand-dark" />
                <span>Run Full Pipeline</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Error Banner with Retry */}
      {error && (
        <Alert
          variant="destructive"
          className="flex items-center justify-between border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-pink shrink-0" />
            <AlertDescription className="text-xs text-brand-pink">{error}</AlertDescription>
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

      {/* 4-Stage Stepper */}
      <PipelineStepper
        currentStage={activeTab}
        completedStages={completedStages}
        onSelectStage={(stage) => setActiveTab(stage)}
        isLoading={runningStep !== null}
      />

      {/* Stage Tab Container */}
      <div className="space-y-6">
        {activeTab === 'structured' && <Stage1Structured structured={structured} />}

        {activeTab === 'match' && (
          <Stage2Match
            analysis={analysis}
            isRunning={runningStep === 'match'}
            isDisabled={runningStep !== null}
            onRun={() => runStage('match')}
          />
        )}

        {activeTab === 'strategy' && (
          <Stage3Strategy
            strategy={strategy}
            hasAnalysis={!!analysis}
            isRunning={runningStep === 'strategy'}
            isDisabled={runningStep !== null}
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
            isRunning={runningStep === 'resume'}
            isDisabled={runningStep !== null}
            onRun={() => runStage('resume')}
          />
        )}
      </div>
    </div>
  );
}
