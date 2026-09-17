'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCreateJob } from '@/hooks/usePramanApi';
import { JdIngestionForm } from './_components/JdIngestionForm';
import { JdResultView } from './_components/JdResultView';

export default function NewJobPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [createdJd, setCreatedJd] = useState<any>(null);
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
    try {
      const data = await createJobMutation.mutateAsync({ rawText });
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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

      {error && (
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
