'use client';

import type { ApplicationTracker } from '@praman/schemas';
import {
  Briefcase,
  Calendar,
  ChevronDown,
  Clock,
  Edit2,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  User,
  Video,
} from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JobTrackerDossierCardProps {
  status: string;
  tracker?: ApplicationTracker | null;
  jobTitle?: string | null;
  onStatusChange: (status: string) => void;
  onOpenDossier: () => void;
  onOpenAddRound: () => void;
}

const JOB_STATUSES = ['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'] as const;

export const JobTrackerDossierCard: React.FC<JobTrackerDossierCardProps> = ({
  status,
  tracker,
  jobTitle,
  onStatusChange,
  onOpenDossier,
  onOpenAddRound,
}) => {
  const milestones = tracker?.milestones || [];

  const upcomingMilestone = milestones
    .filter((m) => m.status === 'SCHEDULED' && m.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];

  return (
    <Card className="p-6 rounded-2xl border-border bg-card/80 backdrop-blur-md shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Application Dossier & Pipeline
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold gap-1.5 rounded-full border-border bg-muted/40 hover:bg-muted cursor-pointer"
                  >
                    <span className="capitalize">{status.toLowerCase()}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-40">
                {JOB_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onStatusChange(s)}
                    className="text-xs capitalize"
                  >
                    {s.toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {jobTitle ? (
              <>
                Tracking pipeline & notes for{' '}
                <span className="font-semibold text-foreground">{jobTitle}</span>.
              </>
            ) : (
              'Track candidate milestones, interview schedules, compensation discussions, and preparation notes.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDossier}
            className="text-xs gap-1.5 border-border bg-card hover:bg-muted"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onOpenAddRound}
            className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Interview Round</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
        <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Applied Date
          </span>
          <span className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {tracker?.appliedDate || 'Not specified'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Target Comp
          </span>
          <span className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
            {tracker?.targetSalary || 'Not specified'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Recruiter / Contact
          </span>
          <span className="text-sm font-semibold text-foreground mt-1 truncate flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            {tracker?.recruiterName || tracker?.recruiterEmail || 'None added'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Application Portal
          </span>
          {tracker?.portalUrl ? (
            <a
              href={tracker.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-primary mt-1 truncate hover:underline flex items-center gap-1.5"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Open Portal</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground mt-1 block">No link added</span>
          )}
        </div>
      </div>

      {upcomingMilestone && (
        <div className="mt-6 p-4 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 text-brand-cyan flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-foreground block">
                Next Up: {upcomingMilestone.title} ({upcomingMilestone.stage.replace('_', ' ')})
              </span>
              <span className="text-muted-foreground">
                Scheduled for: {new Date(upcomingMilestone.scheduledAt!).toLocaleString()}
                {upcomingMilestone.interviewer ? ` • with ${upcomingMilestone.interviewer}` : ''}
              </span>
            </div>
          </div>

          {upcomingMilestone.meetingLink && (
            <a
              href={upcomingMilestone.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold transition-colors shrink-0 shadow-xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Meeting</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
};
