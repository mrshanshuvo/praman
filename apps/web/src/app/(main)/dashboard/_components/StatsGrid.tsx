'use client';

import type { CandidatePersonal, CandidateProfile, JobDescriptionRecord } from '@praman/schemas';
import { Briefcase, Cpu, ExternalLink, FolderGit2, MapPin, ShieldCheck, User } from 'lucide-react';
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

  const initials = personal.name
    ? personal.name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ME';

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
      <Card className="p-6 border-border bg-card shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Active Candidate Profile</h3>
              <p className="text-xs text-muted-foreground">
                Truth-verified ground truth for AI resume tailoring
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="text-xs text-brand-cyan hover:underline flex items-center gap-1.5 font-semibold group"
          >
            <span>Edit Profile</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 flex items-center justify-center font-bold text-lg font-mono shrink-0 shadow-2xs">
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-lg font-bold text-foreground truncate">
                  {personal.name || 'Candidate Profile'}
                </h4>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-success/10 text-success border border-success/30">
                  <ShieldCheck className="w-3 h-3 text-success" />
                  <span>Truthful Baseline</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-medium text-foreground/90">
                  {personal.title || 'Full-Stack Developer'}
                </span>
                {personal.location ? (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      {personal.location}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <div className="p-3 px-5 rounded-xl bg-card border border-border/80 shadow-2xs flex flex-col items-center">
              <div className="flex items-center gap-1 text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <Cpu className="w-3 h-3 text-brand-cyan" />
                <span>Skills</span>
              </div>
              <span className="text-xl font-extrabold font-mono text-brand-cyan">
                {skillsCount}
              </span>
            </div>

            <div className="p-3 px-5 rounded-xl bg-card border border-border/80 shadow-2xs flex flex-col items-center">
              <div className="flex items-center gap-1 text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <Briefcase className="w-3 h-3 text-success" />
                <span>Experience</span>
              </div>
              <span className="text-xl font-extrabold font-mono text-success">{expCount}</span>
            </div>

            <div className="p-3 px-5 rounded-xl bg-card border border-border/80 shadow-2xs flex flex-col items-center">
              <div className="flex items-center gap-1 text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <FolderGit2 className="w-3 h-3 text-status-neutral" />
                <span>Projects</span>
              </div>
              <span className="text-xl font-extrabold font-mono text-status-neutral">
                {projCount}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
