'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { useUpdateJobStatus } from '@/hooks/usePramanApi';
import { JobTrackerDossierCard } from './JobTrackerDossierCard';
import { MilestonesTimeline } from './MilestonesTimeline';
import { NotesJournal } from './NotesJournal';
import type { JobTrackerHubProps } from './types';

// Rule 3.A: Code-split interactive overlays via next/dynamic
const EditDossierModal = dynamic(
  () => import('./EditDossierModal').then((m) => m.EditDossierModal),
  { ssr: false },
);

const AddMilestoneModal = dynamic(
  () => import('./AddMilestoneModal').then((m) => m.AddMilestoneModal),
  { ssr: false },
);

export const JobTrackerHub: React.FC<JobTrackerHubProps> = ({
  jobId,
  status,
  tracker,
  jobTitle,
}) => {
  const updateStatusMutation = useUpdateJobStatus();

  // Modals state
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);

  const milestones = tracker?.milestones || [];
  const notes = tracker?.notes || [];

  return (
    <div className="space-y-6">
      {/* 1. Top Application Dossier Snapshot Card */}
      <JobTrackerDossierCard
        status={status}
        tracker={tracker}
        jobTitle={jobTitle}
        onStatusChange={(newStatus) =>
          updateStatusMutation.mutate({ id: jobId, status: newStatus })
        }
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenAddRound={() => setIsAddMilestoneOpen(true)}
      />

      {/* 2. Main Dual-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane (7 Cols): Interview Rounds Timeline */}
        <div className="lg:col-span-7">
          <MilestonesTimeline
            jobId={jobId}
            milestones={milestones}
            onOpenAddRound={() => setIsAddMilestoneOpen(true)}
          />
        </div>

        {/* Right Pane (5 Cols): Application Notes & Live Journal */}
        <div className="lg:col-span-5">
          <NotesJournal jobId={jobId} notes={notes} />
        </div>
      </div>

      {/* Dynamic Overlays */}
      {isDossierOpen && (
        <EditDossierModal
          jobId={jobId}
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          tracker={tracker}
        />
      )}

      {isAddMilestoneOpen && (
        <AddMilestoneModal
          jobId={jobId}
          isOpen={isAddMilestoneOpen}
          onClose={() => setIsAddMilestoneOpen(false)}
        />
      )}
    </div>
  );
};
