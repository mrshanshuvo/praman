'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import { AlertCircle, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreateJob } from '@/hooks/usePramanApi';
import { JdIngestionForm, JdResultView } from './_components';

export interface DuplicateJdInfo {
  id: string | null;
  jobTitle?: string | null;
  matchScore?: number | null;
}

export default function NewJobPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [createdJd, setCreatedJd] = useState<JobDescriptionRecord | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateJdInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const createJobMutation = useCreateJob();
  const loading = createJobMutation.isPending;
  const error =
    actionError || (createJobMutation.error ? (createJobMutation.error as Error).message : null);

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
      router.push(`/jobs/${createdJd.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      {/* Navigation & Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <button
            type="button"
            onClick={() => router.push('/jobs')}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Applications</span>
          </button>
          <Badge
            variant="outline"
            className="text-primary bg-primary/10 border-primary/25 text-2xs font-mono px-2 py-0.5"
          >
            STAGE 1 • DETERMINISTIC EXTRACTION
          </Badge>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Target Job Description Ingestion
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
          Paste the target job posting. Our AI extractor decomposes it into verified structured
          schema requirements (mandatory skills, responsibilities, seniority, and work mode).
        </p>
      </div>

      {duplicateInfo && (
        <Card className="mb-6 p-5 border-amber-500/40 bg-amber-500/10 backdrop-blur-md rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Duplicate Job Description Detected
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You previously analyzed this identical job description as{' '}
                  <span className="font-semibold text-foreground">
                    {duplicateInfo.jobTitle || 'Target Role'}
                  </span>
                  {duplicateInfo.matchScore != null && (
                    <span> (Match Score: {duplicateInfo.matchScore}%)</span>
                  )}
                  .
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {duplicateInfo.id && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/jobs/${duplicateInfo.id}`)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium cursor-pointer"
                >
                  View Existing Analysis
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleForceSubmit}
                disabled={loading}
                className="text-xs border-border bg-card hover:bg-muted cursor-pointer"
              >
                Analyze Anyway
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && !duplicateInfo && (
        <Alert
          variant="destructive"
          className="mb-6 flex items-center gap-2 border-destructive/40 bg-destructive/10 text-destructive rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {!createdJd ? (
        <JdIngestionForm
          rawText={rawText}
          loading={loading}
          onTextChange={setRawText}
          onSubmit={handleSubmit}
        />
      ) : (
        <JdResultView createdJd={createdJd} onLaunchPipeline={handleLaunchPipeline} />
      )}
    </div>
  );
}
