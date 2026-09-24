'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  Flame,
  Plus,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ActionItem {
  id: string;
  type: 'interview' | 'tailor' | 'followup' | 'review';
  priority: 'high' | 'medium' | 'normal';
  title: string;
  subtitle: string;
  detail: string;
  badgeText: string;
  badgeVariant: 'warning' | 'info' | 'success' | 'destructive';
  actionLabel: string;
  actionHref: string;
  score?: number;
}

interface ActionCenterCardProps {
  jobs: JobDescriptionRecord[];
  onOpenQuickIngest?: () => void;
}

export function ActionCenterCard({ jobs = [], onOpenQuickIngest }: ActionCenterCardProps) {
  const [now] = useState(() => Date.now());

  const actionItems: ActionItem[] = [];

  for (const job of jobs) {
    const jobTitle = job.structured?.jobTitle || 'Target Role';
    const company = job.structured?.company || 'Target Company';

    // 1. Check for Upcoming Scheduled Interviews
    const milestones = job.tracker?.milestones || [];
    for (const m of milestones) {
      if (m.status === 'SCHEDULED' && m.scheduledAt) {
        const scheduledTime = new Date(m.scheduledAt).getTime();
        const diffHours = (scheduledTime - now) / (1000 * 60 * 60);

        // Within next 7 days or upcoming
        if (diffHours > -2 && diffHours < 168) {
          const isUrgent = diffHours <= 48;
          const dateStr = new Date(m.scheduledAt).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });

          actionItems.push({
            id: `interview-${m.id || job.id}`,
            type: 'interview',
            priority: isUrgent ? 'high' : 'medium',
            title: `${m.title || 'Interview Round'} with ${company}`,
            subtitle: jobTitle,
            detail: dateStr,
            badgeText: isUrgent ? 'Upcoming (48h)' : 'Scheduled',
            badgeVariant: isUrgent ? 'destructive' : 'warning',
            actionLabel: 'Review Strategy',
            actionHref: `/jobs/${job.id}?stage=strategy`,
          });
        }
      }
    }

    // 2. High Match Score but Resume not yet generated
    const matchScore = job.analysis?.matchScore ?? 0;
    const hasResume = Boolean(job.analysis?.strategy?.resume?.resumeJson);

    if (matchScore && matchScore >= 65 && !hasResume) {
      actionItems.push({
        id: `tailor-${job.id}`,
        type: 'tailor',
        priority: matchScore >= 80 ? 'high' : 'medium',
        title: `High Match Ready for Tailoring`,
        subtitle: `${jobTitle} · ${company}`,
        detail: `Confirmed fact alignment: ${matchScore}% match score`,
        badgeText: `${matchScore}% Match`,
        badgeVariant: 'success',
        actionLabel: 'Tailor Resume',
        actionHref: `/jobs/${job.id}?stage=match`,
        score: matchScore,
      });
    }

    // 3. Stale applications needing follow-up (applied > 7 days ago without upcoming milestone)
    if (job.status === 'APPLIED') {
      const appliedDateStr = job.tracker?.appliedDate || job.createdAt;
      const appliedTime = appliedDateStr
        ? new Date(appliedDateStr).getTime()
        : new Date(job.createdAt).getTime();
      const daysSince = Math.floor((now - appliedTime) / (1000 * 60 * 60 * 24));

      const hasUpcomingMilestone = milestones.some(
        (m) => m.status === 'SCHEDULED' && new Date(m.scheduledAt || 0).getTime() > now,
      );

      if (daysSince >= 7 && !hasUpcomingMilestone) {
        actionItems.push({
          id: `followup-${job.id}`,
          type: 'followup',
          priority: 'normal',
          title: `Follow Up on Application`,
          subtitle: `${jobTitle} · ${company}`,
          detail: `Applied ${daysSince} days ago without status change`,
          badgeText: `Stale (${daysSince}d)`,
          badgeVariant: 'info',
          actionLabel: 'Check In & Log Note',
          actionHref: `/jobs/${job.id}?view=tracker`,
        });
      }
    }

    // 4. Freshly generated resume awaiting final review
    if (hasResume && (job.status === 'SAVED' || job.status === 'APPLIED')) {
      const resumeVersion = job.analysis?.strategy?.resume?.version || 1;
      const isDraft = job.analysis?.strategy?.resume?.status === 'DRAFT';
      if (isDraft) {
        actionItems.push({
          id: `review-${job.id}`,
          type: 'review',
          priority: 'medium',
          title: `Verify Tailored Resume Draft`,
          subtitle: `${jobTitle} · ${company}`,
          detail: `Version ${resumeVersion} compiled · Proofreading suggested`,
          badgeText: 'Ready to Review',
          badgeVariant: 'info',
          actionLabel: 'Open Studio',
          actionHref: `/jobs/${job.id}/resume`,
        });
      }
    }
  }

  // Sort priority: high > medium > normal
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, normal: 2 };
  actionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Display top 3-4 most critical actions
  const displayedItems = actionItems.slice(0, 4);

  return (
    <Card className="p-6 border-border bg-card shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Action Center</h3>
              {actionItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                  {actionItems.length} pending
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Prioritized daily tasks across your application pipeline
            </p>
          </div>
        </div>

        {onOpenQuickIngest && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenQuickIngest}
            className="text-xs border-border bg-card hover:bg-muted gap-1.5 cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Quick Ingest JD</span>
          </Button>
        )}
      </div>

      {displayedItems.length === 0 ? (
        <div className="py-8 px-4 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-success/10 text-success mx-auto flex items-center justify-center border border-success/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">All Caught Up!</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No urgent interview preparations, stale follow-ups, or unverified draft resumes. Your
            pipeline is running cleanly.
          </p>
          {onOpenQuickIngest && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenQuickIngest}
              className="text-xs border-border mt-2 cursor-pointer gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Target Another Role</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {displayedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold uppercase tracking-wider border ${
                      item.badgeVariant === 'destructive'
                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : item.badgeVariant === 'warning'
                          ? 'bg-warning/10 text-warning border-warning/30'
                          : item.badgeVariant === 'success'
                            ? 'bg-success/10 text-success border-success/30'
                            : 'bg-info/10 text-info border-info/30'
                    }`}
                  >
                    {item.type === 'interview' && <Calendar className="w-3 h-3" />}
                    {item.type === 'tailor' && <Sparkles className="w-3 h-3" />}
                    {item.type === 'followup' && <Clock className="w-3 h-3" />}
                    {item.type === 'review' && <FileCheck className="w-3 h-3" />}
                    <span>{item.badgeText}</span>
                  </span>

                  {item.priority === 'high' && (
                    <span className="text-2xs font-bold text-destructive flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
                      Urgent
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-brand-cyan transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <p className="text-2xs text-muted-foreground font-mono">{item.detail}</p>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-end">
                <Link
                  href={item.actionHref}
                  className={buttonVariants({
                    variant: 'outline',
                    size: 'sm',
                    className:
                      'h-7 text-2xs px-2.5 bg-card hover:bg-muted text-foreground border border-border gap-1.5 font-medium cursor-pointer shadow-2xs',
                  })}
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3 h-3 text-brand-cyan" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
