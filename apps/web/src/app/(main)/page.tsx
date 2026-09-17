'use client';

import { useCandidateProfile, useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';
import { FeatureHighlights, HeroSection, PipelineArchitecture, StatsGrid } from './_components';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  // Only query protected endpoints when user is authenticated
  const { data: profile } = useCandidateProfile({ enabled: isAuthenticated });
  const { data: jds = [] } = useJobs({ enabled: isAuthenticated });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <HeroSection jdCount={jds.length} isAuthenticated={isAuthenticated} />

      {isAuthenticated ? <StatsGrid profile={profile} /> : <FeatureHighlights />}

      <PipelineArchitecture />
    </div>
  );
}
