'use client';

import { useCandidateProfile, useJobs } from '@/hooks/usePramanApi';
import { HeroSection } from './_components/HeroSection';
import { PipelineArchitecture } from './_components/PipelineArchitecture';
import { StatsGrid } from './_components/StatsGrid';

export default function HomePage() {
  const { data: profile } = useCandidateProfile();
  const { data: jds = [] } = useJobs();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <HeroSection jdCount={jds.length} />
      <StatsGrid profile={profile} />
      <PipelineArchitecture />
    </div>
  );
}
