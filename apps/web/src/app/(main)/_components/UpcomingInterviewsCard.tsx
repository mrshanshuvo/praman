'use client';

import type { InterviewMilestone, JobDescriptionRecord } from '@praman/schemas';
import { Calendar, ChevronRight, Clock, Video } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface UpcomingInterviewsCardProps {
  jobs: JobDescriptionRecord[];
}

interface ScheduledMilestoneItem {
  jobId: string;
  jobTitle: string;
  companyName: string;
  milestone: InterviewMilestone;
}

export const UpcomingInterviewsCard: React.FC<UpcomingInterviewsCardProps> = ({ jobs }) => {
  const scheduledRounds: ScheduledMilestoneItem[] = [];

  jobs.forEach((j) => {
    const milestones = j.tracker?.milestones || [];
    milestones.forEach((m) => {
      if (m.status === 'SCHEDULED' && m.scheduledAt) {
        scheduledRounds.push({
          jobId: j.id,
          jobTitle: j.structured?.jobTitle || 'Target Position',
          companyName: j.structured?.locationOrWorkMode || 'Application',
          milestone: m,
        });
      }
    });
  });

  // Sort by earliest scheduledAt
  scheduledRounds.sort(
    (a, b) =>
      new Date(a.milestone.scheduledAt!).getTime() - new Date(b.milestone.scheduledAt!).getTime(),
  );

  const displayRounds = scheduledRounds.slice(0, 3);

  return (
    <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-status-info-subtle text-status-info flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Upcoming Interview Horizon</h3>
            <p className="text-xs text-muted-foreground">
              {scheduledRounds.length} upcoming interview session
              {scheduledRounds.length === 1 ? '' : 's'} scheduled
            </p>
          </div>
        </div>

        <Link
          href="/jobs"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
        >
          <span>All Applications</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {displayRounds.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2">
          <Calendar className="w-6 h-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            No upcoming interview rounds scheduled. Open a job tracker to log screening calls and
            interviews.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayRounds.map(({ jobId, jobTitle, companyName, milestone }) => (
            <div
              key={milestone.id}
              className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{jobTitle}</span>
                  <span className="text-muted-foreground">· {companyName}</span>
                  <Badge variant="outline" className="text-2xs uppercase font-mono">
                    R{milestone.roundNumber} {milestone.stage.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-brand-cyan" />
                    {new Date(milestone.scheduledAt!).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {milestone.interviewer && <span>• with {milestone.interviewer}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {milestone.meetingLink && (
                  <a
                    href={milestone.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Call</span>
                  </a>
                )}

                <Link
                  href={`/jobs/${jobId}?view=tracker`}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                >
                  View Tracker
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
