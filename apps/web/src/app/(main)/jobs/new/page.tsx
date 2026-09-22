'use client';

import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreateJob } from '@/hooks/usePramanApi';
import { JdIngestionForm, JdResultView } from './_components';

export default function NewJobPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [createdJd, setCreatedJd] = useState<any>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
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
    } catch (err: any) {
      if (err.data?.code === 'DUPLICATE_JD' || err.status === 409) {
        setDuplicateInfo(err.data?.existingJd || { id: null });
      } else {
        setActionError(err.message || 'An error occurred while analyzing the job description');
      }
    }
  };

  const handleForceSubmit = async () => {
    setActionError(null);
    setDuplicateInfo(null);
    try {
      const data = await createJobMutation.mutateAsync({ rawText, force: true });
      setCreatedJd(data);
    } catch (err: any) {
      setActionError(err.message || 'An error occurred while analyzing the job description');
    }
  };

  const handleLaunchPipeline = () => {
    if (createdJd?.id) {
      router.push(`/jobs/${createdJd.id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className="text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30 text-xs font-mono"
          >
            STAGE 1 • DETERMINISTIC EXTRACTION
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Target Job Description Ingestion
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste the target job posting. Our AI extractor decomposes it into verified structured
          schema requirements (mandatory skills, responsibilities, seniority, work mode).
        </p>
      </div>

      {duplicateInfo && (
        <Card className="mb-6 p-5 border-warning/40 bg-warning/10 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
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
                  className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark text-xs font-medium cursor-pointer"
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
          className="mb-6 flex items-center gap-2 border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
        >
          <AlertCircle className="w-4 h-4 text-brand-pink shrink-0" />
          <AlertDescription className="text-xs text-brand-pink">{error}</AlertDescription>
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
