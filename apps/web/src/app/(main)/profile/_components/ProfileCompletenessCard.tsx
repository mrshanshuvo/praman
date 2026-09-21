'use client';

import { CheckCircle2, Circle, Sparkles, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ProfileTabId } from './ProfileNavTabs';

interface ProfileCompletenessProps {
  personal: any;
  experiences: any[];
  projects: any[];
  skills: any[];
  educations: any[];
  certifications: any[];
  onNavigateTab: (tab: ProfileTabId) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  weight: number;
  completed: boolean;
  tab: ProfileTabId;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessProps> = ({
  personal = {},
  experiences = [],
  projects = [],
  skills = [],
  educations = [],
  certifications = [],
  onNavigateTab,
}) => {
  const checklist: ChecklistItem[] = useMemo(() => {
    const hasName = Boolean(personal.name?.trim());
    const hasTitle = Boolean(personal.title?.trim());
    const hasEmail = Boolean(personal.contact?.email?.trim());
    const hasLinksOrLocation = Boolean(
      personal.location?.trim() ||
        personal.links?.github ||
        personal.links?.linkedin ||
        personal.links?.portfolio,
    );

    const hasOneExp = experiences.length >= 1;
    const hasMultipleExp = experiences.length >= 2;

    const hasOneProj = projects.length >= 1;
    const hasMultipleProj = projects.length >= 2;

    const hasSkills = skills.length >= 3;
    const hasSkillEvidence = skills.some((s) => s.evidence && s.evidence.trim().length > 0);

    const hasEdu = educations.length >= 1;
    const hasCertOrEduDetails =
      certifications.length >= 1 || educations.some((e) => e.details?.trim());

    return [
      {
        id: 'personal_basics',
        label: 'Name & Professional Title',
        weight: 10,
        completed: hasName && hasTitle,
        tab: 'personal',
      },
      {
        id: 'contact_links',
        label: 'Contact Email & Links/Location',
        weight: 10,
        completed: hasEmail && hasLinksOrLocation,
        tab: 'personal',
      },
      {
        id: 'experience_core',
        label: 'At least 1 Work Experience',
        weight: 15,
        completed: hasOneExp,
        tab: 'experiences',
      },
      {
        id: 'experience_multi',
        label: '2+ Work Experiences with achievements',
        weight: 10,
        completed: hasMultipleExp,
        tab: 'experiences',
      },
      {
        id: 'projects_core',
        label: 'At least 1 Portfolio Project',
        weight: 10,
        completed: hasOneProj,
        tab: 'projects',
      },
      {
        id: 'projects_multi',
        label: '2+ Projects with outcomes',
        weight: 10,
        completed: hasMultipleProj,
        tab: 'projects',
      },
      {
        id: 'skills_min',
        label: 'At least 3 Verified Skills',
        weight: 10,
        completed: hasSkills,
        tab: 'skills',
      },
      {
        id: 'skills_evidence',
        label: 'Skill Proof / Project Evidence',
        weight: 10,
        completed: hasSkillEvidence,
        tab: 'skills',
      },
      {
        id: 'education',
        label: 'Educational Background',
        weight: 10,
        completed: hasEdu,
        tab: 'education',
      },
      {
        id: 'certs_extras',
        label: 'Certifications or Education Details',
        weight: 5,
        completed: hasCertOrEduDetails,
        tab: 'certifications',
      },
    ];
  }, [personal, experiences, projects, skills, educations, certifications]);

  const percentage = useMemo(() => {
    return checklist.reduce((acc, item) => (item.completed ? acc + item.weight : acc), 0);
  }, [checklist]);

  const missingItems = useMemo(() => {
    return checklist.filter((item) => !item.completed);
  }, [checklist]);

  const tier = useMemo(() => {
    if (percentage === 100)
      return {
        label: 'Complete & Ready',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
      };
    if (percentage >= 80)
      return {
        label: 'Interview Ready',
        color: 'text-brand-cyan',
        bg: 'bg-brand-cyan/10 border-brand-cyan/30',
      };
    if (percentage >= 50)
      return {
        label: 'Good Progress',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10 border-amber-500/30',
      };
    return {
      label: 'Needs Information',
      color: 'text-brand-pink',
      bg: 'bg-brand-pink/10 border-brand-pink/30',
    };
  }, [percentage]);

  return (
    <Card className="mb-8 border-border bg-card/70 backdrop-blur-md p-5 sm:p-6 transition-all duration-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Profile Completeness</h2>
              <Badge
                variant="outline"
                className={`text-xs font-medium ${tier.bg} ${tier.color} px-2 py-0.5`}
              >
                {tier.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your verified profile facts are used to generate tailored resumes and outreach
              materials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden mb-4 border border-border/40">
        <div
          className="h-full bg-linear-to-r from-brand-cyan to-brand-pink transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Actionable Suggestions when incomplete */}
      {missingItems.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Recommended additions to reach 100%:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {missingItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateTab(item.tab)}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-border/70 bg-card hover:bg-muted hover:border-brand-cyan/40 text-foreground transition-colors cursor-pointer group"
              >
                <Circle className="w-3 h-3 text-brand-pink shrink-0" />
                <span>{item.label}</span>
                <span className="text-[10px] text-muted-foreground group-hover:text-brand-cyan ml-0.5">
                  +{item.weight}%
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            All core resume profile dimensions are fully populated. Ready for optimal match
            accuracy!
          </span>
        </div>
      )}
    </Card>
  );
};
