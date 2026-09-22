'use client';

import { CheckCircle2, ChevronRight, FileText, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MatchScoreBadge } from '@/components/MatchScoreBadge';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDeleteJob, useUpdateJobStatus } from '@/hooks/usePramanApi';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SAVED: {
    label: 'Saved',
    className: 'bg-muted text-muted-foreground border-border',
  },
  APPLIED: {
    label: 'Applied',
    className: 'bg-info/10 text-info border-info/30',
  },
  INTERVIEWING: {
    label: 'Interviewing',
    className: 'bg-status-neutral/10 text-status-neutral border-status-neutral/30',
  },
  OFFER: {
    label: 'Offer',
    className: 'bg-success/10 text-success border-success/30',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

interface JobCardProps {
  jd: any;
}

export function JobCard({ jd }: JobCardProps) {
  const structured = jd.structured || {};
  const analysis = jd.analysis;
  const matchData = analysis?.result || analysis;
  const strategy = analysis?.strategy;
  const resume = strategy?.resume;

  const hasAnalysis = !!analysis;
  const hasStrategy = !!strategy;
  const hasResume = !!resume;
  const isResumeValidated = resume?.status === 'VALIDATED';

  const deleteJobMutation = useDeleteJob();
  const updateStatusMutation = useUpdateJobStatus();

  const currentStatus = jd.status || 'SAVED';

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete "${structured.jobTitle || 'this job'}" and all associated pipeline stages?`,
      )
    ) {
      try {
        await deleteJobMutation.mutateAsync(jd.id);
        toast.success(`Deleted "${structured.jobTitle || 'Job'}"`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete job');
      }
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      await updateStatusMutation.mutateAsync({ id: jd.id, status: newStatus });
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  return (
    <Card className="group border-border bg-card/80 hover:bg-card hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition-all duration-200 backdrop-blur-md p-5 gap-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-brand-pink dark:group-hover:text-brand-cyan transition truncate">
              {structured.jobTitle || 'Target Role'}
            </h3>

            {/* Application Status Dropdown */}
            <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
              <select
                value={currentStatus}
                onChange={handleStatusChange}
                disabled={updateStatusMutation.isPending}
                aria-label="Application Status"
                className={`text-xs font-medium rounded-full px-2.5 py-0.5 border transition-colors cursor-pointer outline-none ${
                  STATUS_CONFIG[currentStatus]?.className || STATUS_CONFIG.SAVED.className
                }`}
              >
                <option value="SAVED" className="bg-card text-foreground">
                  Saved
                </option>
                <option value="APPLIED" className="bg-card text-foreground">
                  Applied
                </option>
                <option value="INTERVIEWING" className="bg-card text-foreground">
                  Interviewing
                </option>
                <option value="OFFER" className="bg-card text-foreground">
                  Offer
                </option>
                <option value="REJECTED" className="bg-card text-foreground">
                  Rejected
                </option>
              </select>
            </div>

            {structured.seniority && (
              <Badge
                variant="outline"
                className="text-xs font-mono text-muted-foreground border-border bg-muted/70 px-2 py-0.5"
              >
                {structured.seniority}
              </Badge>
            )}
            {structured.locationOrWorkMode && (
              <span className="text-xs text-muted-foreground">
                • {structured.locationOrWorkMode}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {jd.rawText?.slice(0, 180)}...
          </p>

          {/* Skill tags preview: Cyan for Required, Pink for Preferred */}
          {((structured.requiredSkills?.length ?? 0) > 0 ||
            (structured.preferredSkills?.length ?? 0) > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
              {structured.requiredSkills?.slice(0, 3).map((skill: string, idx: number) => (
                <Badge
                  key={`req-${idx}`}
                  variant="outline"
                  className="text-xs font-mono bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 py-0.5 px-2.5 h-6"
                >
                  ✓ {skill}
                </Badge>
              ))}
              {structured.preferredSkills?.slice(0, 2).map((skill: string, idx: number) => (
                <Badge
                  key={`pref-${idx}`}
                  variant="outline"
                  className="text-xs font-mono bg-brand-pink/15 text-brand-pink border-brand-pink/40 py-0.5 px-2.5 h-6"
                >
                  + {skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Stage Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className="gap-1.5 bg-brand-cyan/10 text-brand-cyan border-brand-cyan/40 text-xs font-medium px-2.5 py-0.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" /> Stage 1: Analyzed
            </Badge>

            {hasAnalysis ? (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="gap-1.5 bg-brand-cyan/10 text-brand-cyan border-brand-cyan/40 text-xs font-medium px-2.5 py-0.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" /> Stage 2: Matched
                </Badge>
                <MatchScoreBadge analysis={matchData} variant="compact" />
              </div>
            ) : (
              <Badge
                variant="outline"
                className="gap-1.5 bg-muted/70 text-muted-foreground border-border text-xs px-2.5 py-0.5"
              >
                Stage 2: Pending
              </Badge>
            )}

            {hasStrategy ? (
              <Badge
                variant="outline"
                className="gap-1.5 bg-brand-cyan/10 text-brand-cyan border-brand-cyan/40 text-xs font-medium px-2.5 py-0.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" /> Stage 3: Strategized
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1.5 bg-muted/70 text-muted-foreground border-border text-xs px-2.5 py-0.5"
              >
                Stage 3: Pending
              </Badge>
            )}

            {hasResume ? (
              <Badge
                variant="outline"
                className={`gap-1.5 text-xs font-medium px-2.5 py-0.5 ${
                  isResumeValidated
                    ? 'bg-brand-pink/15 border-brand-pink/40 text-brand-pink dark:bg-brand-cyan/15 dark:border-brand-cyan/40 dark:text-brand-cyan'
                    : 'bg-brand-pink/15 border-brand-pink/40 text-brand-pink'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Resume: {resume.status}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1.5 bg-muted/70 text-muted-foreground border-border text-xs px-2.5 py-0.5"
              >
                Stage 4: Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
          <Link
            href={`/jobs/${jd.id}`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'border-border bg-muted/60 hover:bg-muted hover:border-brand-pink/40 hover:text-brand-pink dark:hover:border-border dark:hover:text-foreground text-foreground gap-1.5 transition-colors',
            })}
          >
            <span>Inspect Stages</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>

          {hasResume && (
            <Link
              href={`/jobs/${jd.id}/resume`}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className:
                  'border-brand-pink/40 bg-brand-pink/10 hover:bg-brand-pink/20 text-brand-pink dark:border-brand-cyan/40 dark:bg-brand-cyan/15 dark:hover:bg-brand-cyan/25 dark:text-brand-cyan gap-1.5 transition-colors',
              })}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume</span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteJobMutation.isPending}
            title="Delete Job"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            {deleteJobMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
