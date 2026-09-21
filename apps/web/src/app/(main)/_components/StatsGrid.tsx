'use client';

import type { CandidatePersonal, CandidateProfile, JobDescriptionRecord } from '@praman/schemas';
import { ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PipelineFunnelCard } from './PipelineFunnelCard';
import { SkillGapInsightsCard } from './SkillGapInsightsCard';
import { UpcomingInterviewsCard } from './UpcomingInterviewsCard';

interface StatsGridProps {
  profile?: CandidateProfile | null;
  jobs?: JobDescriptionRecord[];
}

export function StatsGrid({ profile, jobs = [] }: StatsGridProps) {
  const personal = (profile?.personal || {}) as Partial<CandidatePersonal>;
  const skillsCount = profile?.skills?.length || 0;
  const expCount = profile?.experiences?.length || 0;
  const projCount = profile?.projects?.length || 0;

  return (
    <div className="space-y-6">
      {/* 1. Upcoming Interview Horizon (High priority for active job seekers) */}
      <UpcomingInterviewsCard jobs={jobs} />

      {/* 2. Core Analytics: Funnel Conversion & Market Skill Gap Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnelCard jobs={jobs} />
        <SkillGapInsightsCard jobs={jobs} profile={profile} />
      </div>

      {/* 3. Confirmed Candidate Profile Snapshot */}
      <Card className="p-6 border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <User className="w-4 h-4 text-brand-cyan" />
            <span>Active Candidate Profile</span>
          </div>
          <Link
            href="/profile"
            className="text-xs text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Edit Profile</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{personal.name || 'Candidate'}</h3>
            <p className="text-sm text-muted-foreground">
              {personal.title || 'Full-Stack Developer'}
              {personal.location ? ` · ${personal.location}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center shrink-0">
            <div className="p-2.5 px-4 rounded-xl bg-muted/40 border border-border">
              <span className="block text-xl font-bold font-mono text-brand-cyan">
                {skillsCount}
              </span>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Skills
              </span>
            </div>
            <div className="p-2.5 px-4 rounded-xl bg-muted/40 border border-border">
              <span className="block text-xl font-bold font-mono text-emerald-400">{expCount}</span>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Experience
              </span>
            </div>
            <div className="p-2.5 px-4 rounded-xl bg-muted/40 border border-border">
              <span className="block text-xl font-bold font-mono text-purple-400">{projCount}</span>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Projects
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
