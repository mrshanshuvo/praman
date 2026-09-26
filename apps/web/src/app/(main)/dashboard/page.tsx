'use client';

import { useCandidateProfile, useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';
import { useJobIngestionModal } from '@/providers/JobIngestionModalProvider';
import {
  ActionCenterCard,
  AiUsageCard,
  PipelineFunnelCard,
  RecentActivityFeed,
  SkillGapInsightsCard,
  UpcomingInterviewsCard,
} from './_components';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { openJobIngestionModal } = useJobIngestionModal();

  const { data: profile } = useCandidateProfile({ enabled: isAuthenticated });
  const { data: rawJobs } = useJobs({ enabled: isAuthenticated });
  const jobs = Array.isArray(rawJobs)
    ? rawJobs
    : rawJobs && Array.isArray((rawJobs as any)?.items)
      ? (rawJobs as any).items
      : [];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Prioritized Action Center: Urgent interviews, untailored high-match positions, stale follow-ups */}
      <ActionCenterCard jobs={jobs} onOpenQuickIngest={() => openJobIngestionModal()} />

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
    </div>
  );
}
