'use client';

import { useState } from 'react';
import { useCandidateProfile, useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';
import {
  ActionCenterCard,
  DashboardHeader,
  QuickIngestModal,
  RecentActivityFeed,
  StatsGrid,
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

      {/* 2. Core Funnel, Market Skill Gaps & Baseline Truth Stats */}
      <StatsGrid profile={profile} jobs={jobs} />

      {/* 3. Real-Time Pipeline Activity Timeline */}
      <RecentActivityFeed jobs={jobs} />

      {/* Quick JD Ingest Modal */}
      <QuickIngestModal isOpen={isQuickIngestOpen} onClose={() => setIsQuickIngestOpen(false)} />
    </div>
  );
}
