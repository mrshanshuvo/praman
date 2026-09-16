'use client';

import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  Cpu,
  FolderGit2,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCandidateProfile, useProfileMutations } from '@/hooks/usePramanApi';
import { CertificationsTab, EducationTab } from './_components/EducationCertsTabs';
import { ExperiencesTab } from './_components/ExperiencesTab';
import { PersonalTab } from './_components/PersonalTab';
import { ProjectsTab } from './_components/ProjectsTab';
import { SkillsTab } from './_components/SkillsTab';

type ProfileTabId =
  | 'personal'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'education'
  | 'certifications';

export default function ProfilePage() {
  const {
    data: profile,
    isLoading: loading,
    isFetching,
    error: fetchError,
    refetch: fetchProfile,
  } = useCandidateProfile();

  const { addSkill, deleteSkill, addExperience, deleteExperience, addProject, deleteProject } =
    useProfileMutations();

  const [activeTab, setActiveTab] = useState<ProfileTabId>('personal');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddSkill = async (payload: any) => {
    try {
      await addSkill.mutateAsync(payload);
      showMsg(`Skill "${payload.name}" added successfully`);
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteSkill = async (id: string, name: string) => {
    if (!confirm(`Remove skill "${name}"?`)) return;
    try {
      await deleteSkill.mutateAsync(id);
      showMsg(`Removed skill "${name}"`);
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleAddExperience = async (payload: any) => {
    try {
      await addExperience.mutateAsync(payload);
      showMsg('Experience record added successfully');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteExp = async (id: string, company: string) => {
    if (!confirm(`Delete experience at ${company}?`)) return;
    try {
      await deleteExperience.mutateAsync(id);
      showMsg('Experience record deleted');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleAddProject = async (payload: any) => {
    try {
      await addProject.mutateAsync(payload);
      showMsg('Project added successfully');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    try {
      await deleteProject.mutateAsync(id);
      showMsg('Project removed');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Header Skeleton */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-2xl bg-muted shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-52 bg-muted" />
                  <Skeleton className="h-5 w-32 rounded-full bg-muted" />
                </div>
                <Skeleton className="h-4 w-40 bg-muted/60" />
                <div className="flex gap-4 pt-1">
                  <Skeleton className="h-3.5 w-24 bg-muted/50" />
                  <Skeleton className="h-3.5 w-32 bg-muted/50" />
                </div>
              </div>
            </div>
            <Skeleton className="h-9 w-28 rounded bg-muted" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-border">
            <Skeleton className="h-7 w-24 rounded-lg bg-muted/40" />
            <Skeleton className="h-7 w-24 rounded-lg bg-muted/40" />
          </div>
        </div>

        {/* Tabs Navigation Skeleton */}
        <div className="flex items-center gap-6 border-b border-border pb-3 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-5 w-24 rounded bg-muted/60 shrink-0" />
          ))}
        </div>

        {/* Tab Content Skeleton */}
        <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
          <Skeleton className="h-6 w-48 bg-muted" />
          <Skeleton className="h-4 w-72 bg-muted/60" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Skeleton className="h-28 rounded-xl bg-muted/40" />
            <Skeleton className="h-28 rounded-xl bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  const personal = profile?.personal || {};
  const experiences = profile?.experiences || [];
  const projects = profile?.projects || [];
  const skills = profile?.skills || [];
  const educations = profile?.educations || [];
  const certifications = profile?.certifications || [];

  const TAB_CONFIG = [
    {
      id: 'personal' as ProfileTabId,
      label: 'Summary & Bio',
      icon: User,
      count: null,
    },
    {
      id: 'experiences' as ProfileTabId,
      label: 'Experiences',
      icon: Briefcase,
      count: experiences.length,
    },
    {
      id: 'projects' as ProfileTabId,
      label: 'Projects',
      icon: FolderGit2,
      count: projects.length,
    },
    {
      id: 'skills' as ProfileTabId,
      label: 'Skills & Levels',
      icon: Cpu,
      count: skills.length,
    },
    {
      id: 'education' as ProfileTabId,
      label: 'Education',
      icon: GraduationCap,
      count: educations.length,
    },
    {
      id: 'certifications' as ProfileTabId,
      label: 'Certifications',
      icon: Award,
      count: certifications.length,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
            notification.type === 'success'
              ? 'bg-success/15 border-success/30 text-success'
              : 'bg-destructive/15 border-destructive/30 text-destructive'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Fetch Error with Retry */}
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
            onClick={() => fetchProfile()}
            className="text-xs border-destructive/30 text-destructive hover:bg-destructive/15 shrink-0"
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Profile Header Card */}
      <Card className="relative overflow-hidden rounded-2xl border-border bg-card/80 p-6 sm:p-8 backdrop-blur-md mb-8 gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-pink/10 border border-brand-pink/30 flex items-center justify-center text-brand-pink dark:bg-brand-cyan/10 dark:border-brand-cyan/30 dark:text-brand-cyan text-2xl font-bold font-mono shadow-xs">
              {personal.name ? personal.name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {personal.name || 'Candidate Profile'}
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink border-brand-pink/30 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/30"
                >
                  Confirmed Facts Source
                </Badge>
              </div>
              <p className="text-muted-foreground text-base mt-1">
                {personal.title || 'Full-Stack Developer'}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-3">
                {personal.location && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground/85">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {personal.location}
                  </span>
                )}
                {personal.contact?.email && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground/85">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {personal.contact.email}
                  </span>
                )}
                {personal.contact?.phone && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground/85">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {personal.contact.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProfile()}
            disabled={isFetching}
            className="text-foreground border-border bg-card hover:bg-muted hover:border-border text-sm transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </Button>
        </div>

        {/* Links bar */}
        {personal.links && Object.keys(personal.links).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-border">
            {Object.entries(personal.links).map(([k, v]: [string, any]) => (
              <a
                key={k}
                href={v}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="capitalize">{k}</span>
              </a>
            ))}
          </div>
        )}
      </Card>

      {/* Profile Section Navigation */}
      <nav
        aria-label="Profile Sections"
        className="flex items-center gap-6 mb-8 mt-2 border-b border-border overflow-x-auto scrollbar-none"
      >
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer select-none shrink-0 whitespace-nowrap ${
                isTabActive
                  ? 'text-foreground font-semibold border-brand-pink dark:border-brand-cyan'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    isTabActive
                      ? 'bg-brand-pink/10 text-brand-pink dark:bg-brand-cyan/10 dark:text-brand-cyan font-medium'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab Contents */}
      {activeTab === 'personal' && <PersonalTab personal={personal} />}
      {activeTab === 'experiences' && (
        <ExperiencesTab
          experiences={experiences}
          onAdd={handleAddExperience}
          onDelete={handleDeleteExp}
        />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab projects={projects} onAdd={handleAddProject} onDelete={handleDeleteProject} />
      )}
      {activeTab === 'skills' && (
        <SkillsTab skills={skills} onAdd={handleAddSkill} onDelete={handleDeleteSkill} />
      )}
      {activeTab === 'education' && <EducationTab educations={educations} />}
      {activeTab === 'certifications' && <CertificationsTab certifications={certifications} />}
    </div>
  );
}
