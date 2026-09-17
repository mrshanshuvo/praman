'use client';

import { ArrowLeft, FileCode, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidationReportPanel } from '@/components/ValidationReportPanel';
import {
  useCandidateProfile,
  useJobResume,
  useJobResumeLatex,
  useRunStage,
} from '@/hooks/usePramanApi';
import { LatexViewer } from './_components/LatexViewer';
import { ResumeAuditHeader } from './_components/ResumeAuditHeader';
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

  const { data: latexData, isLoading: latexLoading } = useJobResumeLatex(id);
  const { data: candidateProfile } = useCandidateProfile();
  const runStageMutation = useRunStage(id);

  const error = fetchError ? (fetchError as Error).message : null;
  const resume = resumeData?.resumeJson;
  const report = resumeData?.validationReport;
  const status = resumeData?.status;
  const downloadUrl = resumeData?.downloadUrl;
  const latex = latexData?.latex;

  const handleRegenerate = async () => {
    try {
      await runStageMutation.mutateAsync('resume');
    } catch (err: any) {
      console.error('Failed to regenerate resume:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl bg-card border border-border" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-150 rounded-2xl bg-card border border-border" />
          <Skeleton className="lg:col-span-5 h-150 rounded-2xl bg-card border border-border" />
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Resume Not Found or Not Generated</h2>
        <p className="text-xs text-muted-foreground">
          {error || 'Stage 4 has not been run for this job description yet.'}
        </p>
        <Link
          href={`/jobs/${id}`}
          className={buttonVariants({
            size: 'sm',
            className:
              'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20 gap-1.5',
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
      <ResumeAuditHeader
        id={id}
        status={status}
        downloadUrl={downloadUrl}
        resumeJson={resume}
        isFetching={isFetching}
        isRegenerating={runStageMutation.isPending}
        onRefresh={() => refetch()}
        onRegenerate={handleRegenerate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="mb-3 bg-muted/60 p-1 border border-border">
              <TabsTrigger value="preview" className="text-xs px-4">
                Structured Resume & Evidence
              </TabsTrigger>
              <TabsTrigger value="latex" className="text-xs px-4 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-brand-cyan" />
                <span>LaTeX Code (.tex)</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview">
              <ResumeViewer
                resume={resume}
                validationReport={report}
                candidateProfile={candidateProfile}
              />
            </TabsContent>

            <TabsContent value="latex">
              {latexLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Loading LaTeX source from Cloudflare R2...
                </div>
              ) : latex ? (
                <LatexViewer
                  jobId={id}
                  latex={latex}
                  downloadUrl={downloadUrl}
                  candidateName={resume.personal?.name}
                  resumeData={resume}
                />
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  LaTeX source not yet generated for this resume.
                </div>
              )}
            </TabsContent>
          </Tabs>
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
