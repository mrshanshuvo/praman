'use client';

import { useCandidateProfile, useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';
import { StatsGrid } from '../_components';
import { DashboardHeader } from './_components/DashboardHeader';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();

  const { data: profile } = useCandidateProfile({ enabled: isAuthenticated });
  const { data: jobs = [] } = useJobs({ enabled: isAuthenticated });

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      <DashboardHeader totalJobs={jobs.length} candidateName={profile?.personal?.name} />

      <StatsGrid profile={profile} jobs={jobs} />
    </div>
  );
}
