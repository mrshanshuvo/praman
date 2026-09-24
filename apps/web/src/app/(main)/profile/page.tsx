'use client';

import { AlertCircle } from 'lucide-react';
import { Suspense } from 'react';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCandidateProfile, useProfileMutations } from '@/hooks/usePramanApi';
import { useUrlTab } from '@/hooks/useUrlParams';
import {
  CertificationsTab,
  EducationTab,
  ExperiencesTab,
  PersonalTab,
  ProfileCompletenessCard,
  ProfileHeaderCard,
  ProfileNavTabs,
  ProfileSkeleton,
  type ProfileTabId,
  ProjectsTab,
  SkillsTab,
  useProfileActions,
} from './_components';

const VALID_PROFILE_TABS: ProfileTabId[] = [
  'personal',
  'experiences',
  'projects',
  'skills',
  'education',
  'certifications',
];

function ProfileContent() {
  const {
    data: profile,
    isLoading: loading,
    isFetching,
    error: fetchError,
    refetch,
  } = useCandidateProfile();
  const muts = useProfileMutations();
  const actions = useProfileActions(muts);

  const [activeTab, setActiveTab] = useUrlTab<ProfileTabId>({
    defaultValue: 'personal',
    validValues: VALID_PROFILE_TABS,
  });

  if (loading) return <ProfileSkeleton />;

  const personal = profile?.personal;
  const experiences = profile?.experiences || [];
  const projects = profile?.projects || [];
  const skills = profile?.skills || [];
  const educations = profile?.educations || [];
  const certifications = profile?.certifications || [];

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8">
      {fetchError && (
        <Alert
          variant="destructive"
          className="mb-6 flex items-center justify-between border-destructive/30 bg-destructive/10 text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <AlertDescription className="text-xs text-destructive">
              {(fetchError as Error).message || 'Failed to load profile data.'}
            </AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs border-destructive/30 text-destructive hover:bg-destructive/15 shrink-0"
          >
            Retry
          </Button>
        </Alert>
      )}

      <ProfileHeaderCard
        personal={personal}
        isFetching={isFetching}
        onRefresh={refetch}
        onUpdatePersonal={actions.handleUpdatePersonal}
      />

      <ProfileCompletenessCard
        personal={personal}
        experiences={experiences}
        projects={projects}
        skills={skills}
        educations={educations}
        certifications={certifications}
        onNavigateTab={setActiveTab}
      />

      <ProfileNavTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        counts={{
          experiences: experiences.length,
          projects: projects.length,
          skills: skills.length,
          education: educations.length,
          certifications: certifications.length,
        }}
      />

      {activeTab === 'personal' && (
        <PersonalTab personal={personal} onUpdate={actions.handleUpdatePersonal} />
      )}
      {activeTab === 'experiences' && (
        <ExperiencesTab
          experiences={experiences}
          onAdd={actions.handleAddExp}
          onUpdate={actions.handleUpdateExp}
          onDelete={actions.handleDeleteExp}
        />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab
          projects={projects}
          onAdd={actions.handleAddProj}
          onUpdate={actions.handleUpdateProj}
          onDelete={actions.handleDeleteProj}
        />
      )}
      {activeTab === 'skills' && (
        <SkillsTab
          skills={skills}
          onAdd={actions.handleAddSk}
          onUpdate={actions.handleUpdateSk}
          onDelete={actions.handleDeleteSk}
        />
      )}
      {activeTab === 'education' && <EducationTab educations={educations} />}
      {activeTab === 'certifications' && <CertificationsTab certifications={certifications} />}

      <ConfirmDeleteDialog
        open={!!actions.pendingDelete}
        onOpenChange={(open) => !open && actions.setPendingDelete(null)}
        title={actions.pendingDelete?.title}
        itemTitle={actions.pendingDelete?.itemTitle}
        isDeleting={actions.isDeleting}
        onConfirm={actions.handleConfirmDelete}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
