'use client';

import type { InterviewMilestone, JobDescriptionRecord } from '@praman/schemas';
import {
  Calendar,
  CalendarPlus,
  ChevronRight,
  Clock,
  ExternalLink,
  FileDown,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadIcsFile, getGoogleCalendarUrl } from '@/lib/calendar';

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

  const handleDownloadIcs = (item: ScheduledMilestoneItem) => {
    const { milestone, jobTitle, companyName } = item;
    if (!milestone.scheduledAt) return;
    const summary = `${milestone.title} - ${jobTitle} (${companyName})`;
    downloadIcsFile(
      {
        title: summary,
        description: `Interview Round: ${milestone.title}\nRole: ${jobTitle}\nCompany/Location: ${companyName}\nInterviewer: ${milestone.interviewer || 'N/A'}\nMeeting Link: ${milestone.meetingLink || 'N/A'}`,
        location: milestone.meetingLink || 'Virtual / Interview Call',
        startDate: milestone.scheduledAt,
        durationMinutes: 45,
      },
      `${jobTitle.toLowerCase().replace(/\s+/g, '_')}_${milestone.title.toLowerCase().replace(/\s+/g, '_')}.ics`,
    );
  };

  if (displayRounds.length === 0) {
    return (
      <div className="p-3 px-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-status-info/10 text-status-info flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-foreground">Interview Horizon: </span>
            <span className="text-muted-foreground">
              0 upcoming rounds scheduled. Log screening calls and interviews in your active job
              trackers.
            </span>
          </div>
        </div>

        <Link
          href="/jobs"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0 group self-end sm:self-auto"
        >
          <span>All Applications</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    );
  }

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

      <div className="space-y-2.5">
        {displayRounds.map((item) => {
          const { jobId, jobTitle, companyName, milestone } = item;
          const googleCalUrl = milestone.scheduledAt
            ? getGoogleCalendarUrl({
                title: `${milestone.title} - ${jobTitle} (${companyName})`,
                description: `Interview Round: ${milestone.title}\nRole: ${jobTitle}\nInterviewer: ${milestone.interviewer || 'N/A'}\nMeeting: ${milestone.meetingLink || 'N/A'}`,
                location: milestone.meetingLink || 'Virtual / Interview Call',
                startDate: milestone.scheduledAt,
                durationMinutes: 45,
              })
            : null;

          return (
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
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 h-7 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Add to Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden sm:inline">Calendar</span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-44">
                    {googleCalUrl && (
                      <DropdownMenuItem
                        onClick={() => window.open(googleCalUrl, '_blank', 'noopener,noreferrer')}
                        className="text-xs gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Google Calendar</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDownloadIcs(item)}
                      className="text-xs gap-2 cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Download .ics file</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
          );
        })}
      </div>
    </Card>
  );
};
