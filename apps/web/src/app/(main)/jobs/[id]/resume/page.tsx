'use client';

import { cn } from 'cn';
import { ArrowLeft, FileCode, GitCompare, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValidationReportPanel } from '@/components/ValidationReportPanel';
import {
  useCandidateProfile,
  useJob,
  useJobResume,
  useJobResumeLatex,
  useResumeVersions,
  useRunStage,
} from '@/hooks/usePramanApi';
import { useUrlQueryParam, useUrlTab } from '@/hooks/useUrlTab';
import { LatexViewer } from './_components/LatexViewer';
import { OutreachTab } from './_components/OutreachTab';
import { ResumeAuditHeader } from './_components/ResumeAuditHeader';
import { ResumeDiffViewer } from './_components/ResumeDiffViewer';
import { ResumeViewer } from './_components/ResumeViewer';

const VALID_TABS = ['latex', 'diff', 'outreach', 'preview'] as const;

export default function ResumeAuditPage() {
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useUrlTab({
    defaultValue: 'latex',
    validValues: VALID_TABS,
  });
  const [selectedVersion, setSelectedVersion] = useUrlQueryParam<string>('version');
  const [selectedTemplate = 'modern-developer', setSelectedTemplate] = useUrlQueryParam<string>(
    'template',
    'modern-developer',
  );
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const { data: jd } = useJob(id);
  const { data: versions } = useResumeVersions(id);
  const {
    data: resumeData,
    isLoading: loading,
    isFetching,
    error: fetchError,
    refetch,
  } = useJobResume(id, selectedVersion);
  const { data: latexData, isLoading: latexLoading } = useJobResumeLatex(
    id,
    selectedTemplate,
    selectedVersion,
  );
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
              'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium gap-1.5 shadow-sm',
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
        latexCode={latex}
        templateId={selectedTemplate}
        matchAnalysis={jd?.analysis?.result || jd?.analysis}
        isFetching={isFetching}
        isRegenerating={runStageMutation.isPending}
        onRefresh={() => refetch()}
        onRegenerate={handleRegenerate}
        versions={versions}
        selectedVersion={selectedVersion}
        onSelectVersion={setSelectedVersion}
        currentVersion={resumeData?.version}
        validationReport={report}
        onOpenDiff={() => setActiveTab('diff')}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* Main Full-Width Studio Canvas */}
      <div className="w-full space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <TabsList className="bg-muted/60 p-1 border border-border">
              <TabsTrigger
                value="latex"
                className="text-xs px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Resume Studio</span>
              </TabsTrigger>
              <TabsTrigger
                value="diff"
                className="text-xs px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5 text-amber-400" />
                <span>Version Diff</span>
                {versions && versions.length > 1 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {versions.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="outreach"
                className="text-xs px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-brand-pink" />
                <span>Cover Letter & Outreach</span>
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="text-xs px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Raw Profile Data</span>
              </TabsTrigger>
            </TabsList>

            {/* On-Demand Audit Modal Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuditModalOpen(true)}
              className="h-8.5 text-xs border-border bg-card hover:bg-muted gap-1.5 cursor-pointer font-medium shadow-xs transition-colors"
              title="Open Verification Audit Report"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Evidence Audit</span>
              {status && (
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold',
                    status === 'VALIDATED'
                      ? 'bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan'
                      : 'bg-muted border-border text-muted-foreground',
                  )}
                >
                  {status}
                </span>
              )}
            </Button>
          </div>

          {/* Tab 1: Resume Studio (LaTeX & Live PDF Preview with SyncTeX) */}
          <TabsContent value="latex" className="m-0 focus-visible:outline-none">
            {latexLoading ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                <span>Loading LaTeX source...</span>
              </div>
            ) : (
              <LatexViewer
                jobId={id}
                latex={latex || ''}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
                downloadUrl={downloadUrl}
                candidateName={resume?.personal?.name || 'resume'}
                resumeData={resume}
                version={selectedVersion}
              />
            )}
          </TabsContent>

          {/* Tab 2: Visual Version Diff Viewer */}
          <TabsContent value="diff" className="m-0 focus-visible:outline-none">
            <ResumeDiffViewer
              jobId={id}
              currentResume={resume}
              currentVersion={selectedVersion}
              versions={versions}
              onRegenerate={handleRegenerate}
              isRegenerating={runStageMutation.isPending}
            />
          </TabsContent>

          {/* Tab 3: Cover Letter & Outreach Studio */}
          <TabsContent value="outreach" className="m-0 focus-visible:outline-none">
            <OutreachTab jobId={id} candidateName={resume?.personal?.name || 'Candidate'} />
          </TabsContent>

          {/* Tab 4: Raw Profile Evidence (Optional Inspector) */}
          <TabsContent value="preview" className="m-0 focus-visible:outline-none">
            <ResumeViewer
              resume={resume}
              validationReport={report}
              candidateProfile={candidateProfile}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* On-Demand Audit Modal */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-6 gap-4">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Resume Evidence Audit</span>
                  {status && (
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold',
                        status === 'VALIDATED'
                          ? 'bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan'
                          : 'bg-muted border-border text-muted-foreground',
                      )}
                    >
                      {status}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Audit report verifying resume claims and skills against confirmed candidate
                  profile facts.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 pr-1">
            <ValidationReportPanel report={report} status={status} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
