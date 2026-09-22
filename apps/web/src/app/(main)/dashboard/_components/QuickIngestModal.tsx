'use client';

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreateJob } from '@/hooks/usePramanApi';

const SAMPLE_JD = `Senior Full-Stack Engineer — Cloud & Distributed Systems

About the Role:
We are looking for a Senior Full-Stack Engineer to lead the design and implementation of highly available cloud infrastructure and real-time frontend experiences.

Key Responsibilities:
- Architect and develop low-latency microservices with Node.js, TypeScript, and PostgreSQL.
- Build reactive, high-performance web applications using Next.js, React, and TailwindCSS.
- Deploy and monitor distributed systems on AWS (ECS, Lambda, S3, RDS) using Terraform.
- Establish CI/CD pipelines and drive testing standards (unit, integration, and E2E).

Required Skills & Experience:
- 5+ years building production web applications in TypeScript and Node.js.
- Strong proficiency in modern React (Hooks, Server Components, State Management).
- Experience with Docker, Kubernetes, and AWS cloud environments.
- Solid background in SQL databases, schema migrations, and indexing optimization.
- Proven track record collaborating with cross-functional product teams.`;

interface QuickIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickIngestModal({ isOpen, onClose }: QuickIngestModalProps) {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [createdJd, setCreatedJd] = useState<any>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const createJobMutation = useCreateJob();
  const loading = createJobMutation.isPending;

  const resetForm = () => {
    setRawText('');
    setCreatedJd(null);
    setDuplicateInfo(null);
    setActionError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  const handleFillSample = () => {
    setRawText(SAMPLE_JD);
    setActionError(null);
    setDuplicateInfo(null);
  };

  const handleLaunchPipeline = () => {
    if (createdJd?.id) {
      handleClose();
      router.push(`/jobs/${createdJd.id}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className="sm:max-w-2xl bg-card border-border shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan">
              <Zap className="w-4 h-4" />
            </span>
            <DialogTitle className="text-lg font-bold text-foreground">
              Quick Target Job Ingestion
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste a target job posting to extract verified structured requirements and kick off
            tailoring.
          </DialogDescription>
        </DialogHeader>

        {createdJd ? (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-sm font-bold text-foreground">
                  Job Description Extracted Successfully
                </h4>
                <p className="text-xs text-muted-foreground">
                  Structured requirements, seniority tier, and core technical skills have been
                  verified.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-card text-foreground font-semibold text-xs border-border"
                  >
                    {createdJd.structured?.jobTitle || createdJd.title || 'Target Position'}
                  </Badge>
                  {createdJd.structured?.company && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                      {createdJd.structured.company}
                    </Badge>
                  )}
                  {createdJd.structured?.seniority && (
                    <Badge
                      variant="outline"
                      className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 text-xs"
                    >
                      {createdJd.structured.seniority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="w-full sm:w-auto text-xs border-border cursor-pointer"
              >
                Ingest Another
              </Button>
              <Button
                size="sm"
                onClick={handleLaunchPipeline}
                className="w-full sm:w-auto text-xs bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Launch Tailoring Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {actionError && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">{actionError}</AlertDescription>
              </Alert>
            )}

            {duplicateInfo && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground space-y-1">
                    <p className="font-semibold">Duplicate Job Description Detected</p>
                    <p className="text-muted-foreground text-2xs">
                      This posting was previously analyzed as{' '}
                      <span className="font-medium text-foreground">
                        {duplicateInfo.jobTitle || 'Target Role'}
                      </span>
                      .
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {duplicateInfo.id && (
                    <Link
                      href={`/jobs/${duplicateInfo.id}`}
                      onClick={handleClose}
                      className="text-2xs text-brand-cyan hover:underline font-semibold"
                    >
                      View Existing Job ➔
                    </Link>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleForceSubmit}
                    disabled={loading}
                    className="ml-auto text-2xs border-warning/40 text-warning hover:bg-warning/10"
                  >
                    Force Ingest Anyway
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Job Description Content</span>
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleFillSample}
                    disabled={loading}
                    className="h-6 px-2 text-2xs text-brand-pink hover:bg-brand-pink/10 cursor-pointer"
                  >
                    Try Sample JD
                  </Button>
                  <span className="text-2xs font-mono text-muted-foreground">
                    {rawText.length} chars
                  </span>
                </div>
              </div>

              <Textarea
                rows={9}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the target job description (responsibilities, requirements, preferred skills)..."
                className="w-full bg-muted/40 border-border rounded-xl p-3 text-xs text-foreground font-mono focus-visible:border-brand-cyan leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading || !rawText.trim()}
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs gap-1.5 shadow-xs cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Requirements...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract & Ingest</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
