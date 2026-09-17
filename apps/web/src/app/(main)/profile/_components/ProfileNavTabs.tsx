'use client';

import { Award, Briefcase, Cpu, FolderGit2, GraduationCap, User } from 'lucide-react';
import React from 'react';

export type ProfileTabId =
  | 'personal'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'education'
  | 'certifications';

interface ProfileNavTabsProps {
  activeTab: ProfileTabId;
  onSelectTab: (tab: ProfileTabId) => void;
  counts: {
    experiences: number;
    projects: number;
    skills: number;
    education: number;
    certifications: number;
  };
}

export const ProfileNavTabs: React.FC<ProfileNavTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  const tabs = [
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
      count: counts.experiences,
    },
    {
      id: 'projects' as ProfileTabId,
      label: 'Projects',
      icon: FolderGit2,
      count: counts.projects,
    },
    {
      id: 'skills' as ProfileTabId,
      label: 'Skills & Levels',
      icon: Cpu,
      count: counts.skills,
    },
    {
      id: 'education' as ProfileTabId,
      label: 'Education',
      icon: GraduationCap,
      count: counts.education,
    },
    {
      id: 'certifications' as ProfileTabId,
      label: 'Certifications',
      icon: Award,
      count: counts.certifications,
    },
  ];

  return (
    <nav
      aria-label="Profile Sections"
      className="flex items-center gap-6 mb-8 mt-2 border-b border-border overflow-x-auto scrollbar-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer select-none shrink-0 whitespace-nowrap ${
              isActive
                ? 'text-foreground font-semibold border-brand-pink dark:border-brand-cyan'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive
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
  );
};
