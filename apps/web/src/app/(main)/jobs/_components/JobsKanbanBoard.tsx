'use client';

import type { InterviewMilestone, JobDescriptionRecord } from '@praman/schemas';
import {
  Archive,
  Briefcase,
  Calendar,
  ChevronRight,
  FileCode,
  GripVertical,
  Trash2,
  Trophy,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { MatchScoreBadge } from '@/components/MatchScoreBadge';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDeleteJob, useUpdateJobStatus } from '@/hooks/usePramanApi';

export const KANBAN_COLUMNS = [
  {
    key: 'SAVED',
    label: 'Saved',
    icon: BookmarkIcon,
    accentColor: 'border-border text-muted-foreground bg-muted/50',
    headerBg: 'bg-muted/30',
    emptyText: 'No saved jobs',
  },
  {
    key: 'APPLIED',
    label: 'Applied',
    icon: Briefcase,
    accentColor: 'border-info/40 text-info bg-info/10',
    headerBg: 'bg-info/5',
    emptyText: 'No applications submitted',
  },
  {
    key: 'INTERVIEWING',
    label: 'Interviewing',
    icon: UserCheck,
    accentColor: 'border-status-neutral/40 text-status-neutral bg-status-neutral/10',
    headerBg: 'bg-status-neutral/5',
    emptyText: 'No active interviews',
  },
  {
    key: 'OFFER',
    label: 'Offer',
    icon: Trophy,
    accentColor: 'border-success/40 text-success bg-success/10',
    headerBg: 'bg-success/5',
    emptyText: 'No offers yet',
  },
  {
    key: 'REJECTED',
    label: 'Archived',
    icon: Archive,
    accentColor: 'border-destructive/40 text-destructive bg-destructive/10',
    headerBg: 'bg-destructive/5',
    emptyText: 'No archived jobs',
  },
] as const;

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

interface JobsKanbanBoardProps {
  jobs: JobDescriptionRecord[];
}

export function JobsKanbanBoard({ jobs }: JobsKanbanBoardProps) {
  const updateStatusMutation = useUpdateJobStatus();
  const deleteJobMutation = useDeleteJob();
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedJobId(id);
  };

  const handleDragEnd = () => {
    setDraggedJobId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnKey: string) => {
    // Only clear if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === columnKey) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData('text/plain') || draggedJobId;
    if (!id) return;

    const targetJob = jobs.find((j) => j.id === id);
    if (!targetJob || (targetJob.status || 'SAVED') === targetStatus) {
      setDraggedJobId(null);
      return;
    }

    const colConfig = KANBAN_COLUMNS.find((c) => c.key === targetStatus);
    const targetTitle = targetJob.structured?.jobTitle || 'Job';
    setDraggedJobId(null);

    updateStatusMutation.mutate(
      { id, status: targetStatus },
      {
        onSuccess: () => {
          toast.success(`"${targetTitle}" moved to ${colConfig?.label || targetStatus}`);
        },
      },
    );
  };

  const handleStatusSelect = (id: string, newStatus: string) => {
    const targetJob = jobs.find((j) => j.id === id);
    const colConfig = KANBAN_COLUMNS.find((c) => c.key === newStatus);
    const targetTitle = targetJob?.structured?.jobTitle || 'Job';

    updateStatusMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`"${targetTitle}" status updated to ${colConfig?.label || newStatus}`);
        },
      },
    );
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete "${title || 'this job'}" and all generated resume records?`,
      )
    ) {
      await deleteJobMutation.mutateAsync(id);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-255">
        {KANBAN_COLUMNS.map((col) => {
          const colJobs = jobs.filter((jd) => (jd.status || 'SAVED') === col.key);
          const isDragTarget = dragOverColumn === col.key;
          const Icon = col.icon;

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={(e) => handleDragLeave(e, col.key)}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-125 ${
                isDragTarget
                  ? 'border-brand-cyan bg-brand-cyan/10 ring-2 ring-brand-cyan/20'
                  : 'border-border/80 bg-card/40'
              }`}
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between px-3.5 py-3 border-b border-border/80 rounded-t-2xl ${col.headerBg}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-lg border ${col.accentColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground tracking-tight">
                    {col.label}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-2xs px-1.5 py-0 border-border bg-background/60 text-muted-foreground"
                >
                  {colJobs.length}
                </Badge>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-20rem)]">
                {colJobs.length === 0 ? (
                  <div className="h-32 border border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center p-3 text-center">
                    <p className="text-xs text-muted-foreground">{col.emptyText}</p>
                    <p className="text-2xs text-muted-foreground/60 mt-0.5">
                      Drag jobs here to advance
                    </p>
                  </div>
                ) : (
                  colJobs.map((jd) => {
                    const structured = jd.structured || {};
                    const analysis = jd.analysis;
                    const strategy = analysis?.strategy;
                    const resume = strategy?.resume;
                    const title = structured.jobTitle || 'Target Role';
                    const hasResume = !!resume?.resumeJson;
                    const isValidated = resume?.status === 'VALIDATED';
                    const isDragging = draggedJobId === jd.id;

                    return (
                      <Card
                        key={jd.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, jd.id)}
                        onDragEnd={handleDragEnd}
                        className={`group p-3.5 border-border bg-card/90 hover:bg-card hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition-all cursor-grab active:cursor-grabbing shadow-xs space-y-3 gap-0 ${
                          isDragging ? 'opacity-40 scale-95 border-dashed border-brand-cyan' : ''
                        }`}
                      >
                        {/* Title & Drag Grip */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/jobs/${jd.id}`}
                              className="text-xs font-semibold text-foreground hover:text-brand-pink dark:hover:text-brand-cyan transition line-clamp-2"
                              title={title}
                            >
                              {title}
                            </Link>
                            {structured.company && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {structured.company}
                              </p>
                            )}
                          </div>
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                        </div>

                        {/* Upcoming Interview Chip */}
                        {(() => {
                          const upcoming = jd.tracker?.milestones
                            ?.filter(
                              (m: InterviewMilestone) => m.status === 'SCHEDULED' && m.scheduledAt,
                            )
                            ?.sort(
                              (a: InterviewMilestone, b: InterviewMilestone) =>
                                new Date(a.scheduledAt ?? '').getTime() -
                                new Date(b.scheduledAt ?? '').getTime(),
                            )[0];
                          if (!upcoming) return null;
                          return (
                            <div className="flex items-center gap-1.5 text-2xs px-2 py-0.5 rounded-md bg-status-neutral/10 border border-status-neutral/20 text-status-neutral font-medium">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {upcoming.stage.replace('_', ' ')} ·{' '}
                                {new Date(upcoming.scheduledAt ?? '').toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Match Score Indicator */}
                        {analysis?.result && (
                          <div className="flex items-center justify-between pt-1">
                            <MatchScoreBadge analysis={analysis.result} variant="compact" />
                            {isValidated && (
                              <span
                                className="text-2xs font-mono px-1.5 py-0.2 rounded border bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 font-bold"
                                title="Resume is validated against candidate evidence"
                              >
                                VALIDATED
                              </span>
                            )}
                          </div>
                        )}

                        {/* Pipeline Stage Mini Badges */}
                        <div className="flex items-center gap-1 text-2xs font-mono pt-1">
                          <span
                            className={`px-1.5 py-0.2 rounded border ${
                              structured.jobTitle
                                ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                            title="Stage 1: Structured JD"
                          >
                            S1
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded border ${
                              analysis
                                ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                            title="Stage 2: Match Analysis"
                          >
                            S2
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded border ${
                              strategy
                                ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                            title="Stage 3: Resume Strategy"
                          >
                            S3
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded border ${
                              hasResume
                                ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                            title="Stage 4: Generated Resume"
                          >
                            S4
                          </span>
                        </div>

                        {/* Actions & Status Changer */}
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1.5">
                          {hasResume ? (
                            <Link
                              href={`/jobs/${jd.id}/resume`}
                              className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                                className:
                                  'h-7 text-xs px-2 border-border hover:border-brand-cyan hover:text-brand-cyan gap-1 text-foreground cursor-pointer flex-1',
                              })}
                            >
                              <FileCode className="w-3 h-3 text-brand-cyan" />
                              <span>Studio</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/jobs/${jd.id}`}
                              className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                                className:
                                  'h-7 text-xs px-2 border-border hover:border-foreground gap-1 text-foreground cursor-pointer flex-1',
                              })}
                            >
                              <span>Pipeline</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}

                          {/* Move to status dropdown */}
                          <select
                            value={col.key}
                            onChange={(e) => handleStatusSelect(jd.id, e.target.value)}
                            disabled={updateStatusMutation.isPending}
                            aria-label="Move application status"
                            className="h-7 text-2xs rounded border border-border bg-card px-1.5 text-foreground outline-none cursor-pointer hover:bg-muted/80"
                          >
                            {KANBAN_COLUMNS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, jd.id, title)}
                            className="w-7 h-7 rounded border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer transition-colors"
                            title="Delete job"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
