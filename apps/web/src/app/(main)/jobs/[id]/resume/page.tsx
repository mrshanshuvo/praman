'use client';

import { cn } from 'cn';
import {
  ArrowLeft,
  FileCode,
  Mail,
  PanelRightClose,
  PanelRightOpen,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { LatexViewer } from './_components/LatexViewer';
import { OutreachTab } from './_components/OutreachTab';
import { ResumeAuditHeader } from './_components/ResumeAuditHeader';
import { ResumeViewer } from './_components/ResumeViewer';

export default function ResumeAuditPage() {
  const params = useParams();
  const id = params.id as string;

  const [selectedTemplate, setSelectedTemplate] = useState('modern-developer');
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);
  const [showAuditPanel, setShowAuditPanel] = useState(true);

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
      />

      <div
        className={cn(
          'grid gap-6 transition-all duration-200',
          showAuditPanel ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1',
        )}
      >
        <div
          className={cn(
            'space-y-4 transition-all duration-200',
            showAuditPanel ? 'lg:col-span-8' : 'w-full',
          )}
        >
          <Tabs defaultValue="preview" className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <TabsList className="bg-muted/60 p-1 border border-border">
                <TabsTrigger value="preview" className="text-xs px-4">
                  Structured Resume & Evidence
                </TabsTrigger>
                <TabsTrigger value="latex" className="text-xs px-4 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>LaTeX Code (.tex)</span>
                </TabsTrigger>
                <TabsTrigger value="outreach" className="text-xs px-4 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-pink" />
                  <span>Cover Letter & Outreach</span>
                </TabsTrigger>
              </TabsList>

              {/* Collapsible Inspector Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuditPanel((prev) => !prev)}
                className={cn(
                  'h-8.5 text-xs border-border bg-card hover:bg-muted gap-1.5 cursor-pointer font-medium shadow-xs transition-colors',
                  showAuditPanel
                    ? 'text-foreground'
                    : 'text-brand-cyan border-brand-cyan/40 bg-brand-cyan/10 hover:bg-brand-cyan/15',
                )}
                title={
                  showAuditPanel ? 'Collapse Evidence Audit panel' : 'Expand Evidence Audit panel'
                }
              >
                {showAuditPanel ? (
                  <PanelRightClose className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <PanelRightOpen className="w-3.5 h-3.5 text-brand-cyan" />
                )}
                <span>{showAuditPanel ? 'Hide Audit' : 'Show Audit'}</span>
                {status && (
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold',
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

            <TabsContent value="preview">
              <ResumeViewer
                resume={resume}
                validationReport={report}
                candidateProfile={candidateProfile}
              />
            </TabsContent>

            <TabsContent value="latex" className="mt-0 outline-none">
              {latexLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Loading LaTeX source from Cloudflare R2...
                </div>
              ) : latex ? (
                <LatexViewer
                  jobId={id}
                  latex={latex}
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                  downloadUrl={downloadUrl}
                  candidateName={resume.personal?.name}
                  resumeData={resume}
                  version={selectedVersion}
                />
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  LaTeX source not yet generated for this resume.
                </div>
              )}
            </TabsContent>

            <TabsContent value="outreach">
              <OutreachTab jobId={id} candidateName={resume.personal?.name} />
            </TabsContent>
          </Tabs>
        </div>

        {showAuditPanel && (
          <div className="lg:col-span-4 space-y-4 animate-in fade-in duration-200">
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-cyan" />
                  <span>Evidence Cross-Check Audit</span>
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAuditPanel(false)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Collapse Audit Panel"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ValidationReportPanel report={report} status={status} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
