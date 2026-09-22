'use client';

import { useState } from 'react';
import { useCandidateProfile, useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';
import {
  ActionCenterCard,
  AiUsageCard,
  DashboardHeader,
  PipelineFunnelCard,
  QuickIngestModal,
  RecentActivityFeed,
  SkillGapInsightsCard,
  UpcomingInterviewsCard,
} from './_components';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [isQuickIngestOpen, setIsQuickIngestOpen] = useState(false);

  const { data: profile } = useCandidateProfile({ enabled: isAuthenticated });
  const { data: jobs = [] } = useJobs({ enabled: isAuthenticated });

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      <DashboardHeader
        totalJobs={jobs.length}
        candidateName={profile?.personal?.name}
        onOpenQuickIngest={() => setIsQuickIngestOpen(true)}
      />

      {/* 1. Prioritized Action Center: Urgent interviews, untailored high-match positions, stale follow-ups */}
      <ActionCenterCard jobs={jobs} onOpenQuickIngest={() => setIsQuickIngestOpen(true)} />

      {/* 2. Upcoming Interview Horizon (High priority for active job seekers) */}
      <UpcomingInterviewsCard jobs={jobs} />

      {/* 3. Core Analytics: Funnel Conversion & Market Skill Gap Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnelCard jobs={jobs} />
        <SkillGapInsightsCard jobs={jobs} profile={profile} />
      </div>

      {/* 4. AI Cost & Token Observability */}
      <AiUsageCard />

      {/* 5. Real-Time Pipeline Activity Timeline */}
      <RecentActivityFeed jobs={jobs} />

      {/* Quick JD Ingest Modal */}
      <QuickIngestModal isOpen={isQuickIngestOpen} onClose={() => setIsQuickIngestOpen(false)} />
    </div>
  );
}
