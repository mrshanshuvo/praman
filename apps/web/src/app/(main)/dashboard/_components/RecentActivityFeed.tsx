'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  FileCode,
  FileText,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ActivityEvent {
  id: string;
  type: 'job' | 'resume' | 'milestone' | 'note';
  title: string;
  subtitle: string;
  timeAgo: string;
  timestampMs: number;
  linkHref: string;
}

function formatRelativeTime(
  dateStr: string | null | undefined,
  nowMs: number,
): { label: string; ms: number } {
  if (!dateStr) return { label: 'Recently', ms: 0 };
  const date = new Date(dateStr);
  const diffMs = nowMs - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return { label: 'Just now', ms: date.getTime() };
  if (diffMin < 60) return { label: `${diffMin}m ago`, ms: date.getTime() };
  if (diffHour < 24) return { label: `${diffHour}h ago`, ms: date.getTime() };
  if (diffDay === 1) return { label: 'Yesterday', ms: date.getTime() };
  if (diffDay < 30) return { label: `${diffDay}d ago`, ms: date.getTime() };
  return {
    label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ms: date.getTime(),
  };
}

interface RecentActivityFeedProps {
  jobs: JobDescriptionRecord[];
}

export function RecentActivityFeed({ jobs = [] }: RecentActivityFeedProps) {
  const [nowMs] = useState(() => Date.now());
  const events: ActivityEvent[] = [];

  for (const job of jobs) {
    const jobTitle = job.structured?.jobTitle || 'Target Role';
    const company = job.structured?.company || 'Target Company';

    // 1. Job Ingested Event
    if (job.createdAt) {
      const { label, ms } = formatRelativeTime(job.createdAt, nowMs);
      events.push({
        id: `job-created-${job.id}`,
        type: 'job',
        title: `Ingested Target Job Description`,
        subtitle: `${jobTitle} · ${company}`,
        timeAgo: label,
        timestampMs: ms,
        linkHref: `/jobs/${job.id}`,
      });
    }

    // 2. Tailored Resume Compiled Event
    const resume = job.analysis?.strategy?.resume;
    if (resume?.resumeJson && (resume.updatedAt || resume.createdAt)) {
      const { label, ms } = formatRelativeTime(resume.updatedAt || resume.createdAt, nowMs);
      events.push({
        id: `resume-${job.id}`,
        type: 'resume',
        title: `Tailored Resume v${resume.version || 1} Generated`,
        subtitle: `${jobTitle} · ${company}`,
        timeAgo: label,
        timestampMs: ms,
        linkHref: `/jobs/${job.id}/resume`,
      });
    }

    // 3. Interview Milestones
    const milestones = job.tracker?.milestones || [];
    for (const m of milestones) {
      const milestoneTime = m.createdAt || m.scheduledAt;
      if (milestoneTime) {
        const { label, ms } = formatRelativeTime(milestoneTime, nowMs);
        events.push({
          id: `milestone-${m.id || job.id}`,
          type: 'milestone',
          title: `${m.status === 'COMPLETED' ? 'Completed' : 'Logged'} ${m.title || 'Interview'}`,
          subtitle: `${jobTitle} · ${company}`,
          timeAgo: label,
          timestampMs: ms,
          linkHref: `/jobs/${job.id}?view=tracker`,
        });
      }
    }

    // 4. Notes Journal entries
    const notes = job.tracker?.notes || [];
    for (const n of notes) {
      if (n.createdAt) {
        const { label, ms } = formatRelativeTime(n.createdAt, nowMs);
        events.push({
          id: `note-${n.id || job.id}`,
          type: 'note',
          title: `Application Journal Note`,
          subtitle: `${jobTitle} · ${company}`,
          timeAgo: label,
          timestampMs: ms,
          linkHref: `/jobs/${job.id}?view=tracker`,
        });
      }
    }
  }

  // Sort descending by timestamp
  events.sort((a, b) => b.timestampMs - a.timestampMs);

  // Show top 6 events
  const displayedEvents = events.slice(0, 6);

  return (
    <Card className="p-6 border-border bg-card shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Pipeline Activity</h3>
            <p className="text-xs text-muted-foreground">
              Recent resume versions, milestone updates, and job ingestions
            </p>
          </div>
        </div>
        <Link href="/jobs">
          <Button
            variant="ghost"
            size="xs"
            className="text-xs text-brand-cyan hover:text-brand-cyan/80 gap-1"
          >
            <span>All Applications</span>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {displayedEvents.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs text-muted-foreground">No recent pipeline activity recorded yet.</p>
        </div>
      ) : (
        <div className="relative pl-3 space-y-3.5 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
          {displayedEvents.map((evt) => (
            <div key={evt.id} className="relative flex items-start gap-3 group">
              <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shrink-0 z-10 group-hover:border-brand-cyan transition-colors">
                {evt.type === 'job' && <FileText className="w-3 h-3 text-brand-cyan" />}
                {evt.type === 'resume' && <FileCode className="w-3 h-3 text-success" />}
                {evt.type === 'milestone' && <Calendar className="w-3 h-3 text-warning" />}
                {evt.type === 'note' && <MessageSquare className="w-3 h-3 text-brand-pink" />}
              </div>

              <div className="flex-1 min-w-0 p-2.5 rounded-lg border border-transparent group-hover:border-border/60 group-hover:bg-muted/30 transition-all flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-brand-cyan transition-colors">
                      {evt.title}
                    </p>
                    <span className="text-2xs font-mono text-muted-foreground shrink-0">
                      {evt.timeAgo}
                    </span>
                  </div>
                  <p className="text-2xs text-muted-foreground truncate">{evt.subtitle}</p>
                </div>

                <Link href={evt.linkHref} className="shrink-0">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-brand-cyan"
                    title="View details"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
