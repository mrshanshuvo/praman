'use client';

import type {
  CandidatePersonal,
  Certification,
  Education,
  Experience,
  Project,
  Skill,
  UpdateCandidatePersonal,
} from '@praman/schemas';
import {
  Check,
  CheckCircle2,
  Circle,
  Code2,
  Edit2,
  Globe,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function getLinkIcon(key: string, className?: string) {
  const k = key.toLowerCase();
  if (k.includes('github')) return <GithubIcon className={className} />;
  if (k.includes('linkedin')) return <LinkedinIcon className={className} />;
  if (k.includes('beecrowd') || k.includes('leetcode') || k.includes('code')) {
    return <Code2 className={className} />;
  }
  return <Globe className={className} />;
}

function extractUsername(key: string, rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  try {
    const urlStr =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    const urlObj = new URL(urlStr);
    const pathname = urlObj.pathname.replace(/^\/+|\/+$/g, '');

    const k = key.toLowerCase();
    if (k.includes('github')) {
      const parts = pathname.split('/');
      return parts[0] || trimmed;
    }

    if (k.includes('linkedin')) {
      const parts = pathname.split('/');
      if (parts[0] === 'in' && parts[1]) {
        return parts[1];
      }
      return parts[0] || trimmed;
    }

    if (k.includes('twitter') || k === 'x') {
      const parts = pathname.split('/');
      return parts[0] ? `@${parts[0]}` : trimmed;
    }

    if (k.includes('beecrowd')) {
      const parts = pathname.split('/');
      return parts[parts.length - 1] || trimmed;
    }

    if (k.includes('portfolio') || k.includes('website') || k.includes('blog')) {
      return urlObj.hostname.replace(/^www\./, '') + (pathname ? `/${pathname}` : '');
    }

    if (pathname) {
      const parts = pathname.split('/');
      return parts[parts.length - 1] || trimmed;
    }
    return urlObj.hostname.replace(/^www\./, '') || trimmed;
  } catch {
    return trimmed.replace(/^@/, '');
  }
}

function normalizeHref(key: string, rawUrl: string): string {
  if (!rawUrl) return '#';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const k = key.toLowerCase();
  if (k.includes('github')) {
    return `https://github.com/${trimmed.replace(/^@/, '')}`;
  }
  if (k.includes('linkedin')) {
    return trimmed.includes('linkedin.com')
      ? `https://${trimmed}`
      : `https://linkedin.com/in/${trimmed.replace(/^@/, '')}`;
  }
  return `https://${trimmed}`;
}
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ProfileTabId } from './ProfileNavTabs';
import { ResumeImportModal } from './ResumeImportModal';

interface ProfileHeaderCardProps {
  personal?: CandidatePersonal | null;
  experiences?: Experience[];
  projects?: Project[];
  skills?: Skill[];
  educations?: Education[];
  certifications?: Certification[];
  onRefresh: () => void;
  onUpdatePersonal: (personal: UpdateCandidatePersonal) => Promise<void>;
  onNavigateTab?: (tab: ProfileTabId) => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  personal,
  experiences = [],
  projects = [],
  skills = [],
  educations = [],
  certifications = [],
  onRefresh,
  onUpdatePersonal,
  onNavigateTab,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: personal?.name || '',
    title: personal?.title || '',
    location: personal?.location || '',
    email: personal?.contact?.email || '',
    phone: personal?.contact?.phone || '',
    github: personal?.links?.github || '',
    linkedin: personal?.links?.linkedin || '',
    portfolio: personal?.links?.portfolio || '',
  });

  const handleOpenEdit = () => {
    setForm({
      name: personal?.name || '',
      title: personal?.title || '',
      location: personal?.location || '',
      email: personal?.contact?.email || '',
      phone: personal?.contact?.phone || '',
      github: personal?.links?.github || '',
      linkedin: personal?.links?.linkedin || '',
      portfolio: personal?.links?.portfolio || '',
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedPersonal: UpdateCandidatePersonal = {
        ...personal,
        name: form.name,
        title: form.title,
        location: form.location,
        contact: {
          ...personal?.contact,
          email: form.email,
          phone: form.phone,
        },
        links: {
          ...(form.github ? { github: form.github } : {}),
          ...(form.linkedin ? { linkedin: form.linkedin } : {}),
          ...(form.portfolio ? { portfolio: form.portfolio } : {}),
        },
      };
      await onUpdatePersonal(updatedPersonal);
      setIsEditOpen(false);
    } catch (err) {
      console.error('Failed to update personal details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const checklist = useMemo(() => {
    const hasName = Boolean(personal?.name?.trim());
    const hasTitle = Boolean(personal?.title?.trim());
    const hasEmail = Boolean(personal?.contact?.email?.trim());
    const hasLinksOrLocation = Boolean(
      personal?.location?.trim() ||
        personal?.links?.github ||
        personal?.links?.linkedin ||
        personal?.links?.portfolio,
    );

    const hasOneExp = (experiences?.length || 0) >= 1;
    const hasMultipleExp = (experiences?.length || 0) >= 2;

    const hasOneProj = (projects?.length || 0) >= 1;
    const hasMultipleProj = (projects?.length || 0) >= 2;

    const hasSkills = (skills?.length || 0) >= 3;
    const hasSkillEvidence = Boolean(
      skills?.some((s) => s.evidence && s.evidence.trim().length > 0),
    );

    const hasEdu = (educations?.length || 0) >= 1;
    const hasCertOrEduDetails = Boolean(
      (certifications?.length || 0) >= 1 || educations?.some((e) => e.details?.trim()),
    );

    return [
      {
        id: 'personal_basics',
        label: 'Name & Title',
        weight: 10,
        completed: hasName && hasTitle,
        tab: 'personal' as ProfileTabId,
      },
      {
        id: 'contact_links',
        label: 'Contact & Links',
        weight: 10,
        completed: hasEmail && hasLinksOrLocation,
        tab: 'personal' as ProfileTabId,
      },
      {
        id: 'experience_core',
        label: '1+ Work Experience',
        weight: 15,
        completed: hasOneExp,
        tab: 'experiences' as ProfileTabId,
      },
      {
        id: 'experience_multi',
        label: '2+ Work Experiences',
        weight: 10,
        completed: hasMultipleExp,
        tab: 'experiences' as ProfileTabId,
      },
      {
        id: 'projects_core',
        label: '1+ Portfolio Project',
        weight: 10,
        completed: hasOneProj,
        tab: 'projects' as ProfileTabId,
      },
      {
        id: 'projects_multi',
        label: '2+ Projects',
        weight: 10,
        completed: hasMultipleProj,
        tab: 'projects' as ProfileTabId,
      },
      {
        id: 'skills_min',
        label: '3+ Skills',
        weight: 10,
        completed: hasSkills,
        tab: 'skills' as ProfileTabId,
      },
      {
        id: 'skills_evidence',
        label: 'Skill Proof',
        weight: 10,
        completed: hasSkillEvidence,
        tab: 'skills' as ProfileTabId,
      },
      {
        id: 'education',
        label: 'Education',
        weight: 10,
        completed: hasEdu,
        tab: 'education' as ProfileTabId,
      },
      {
        id: 'certs_extras',
        label: 'Certifications',
        weight: 5,
        completed: hasCertOrEduDetails,
        tab: 'certifications' as ProfileTabId,
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
        color: 'text-success',
        bg: 'bg-success/10 border-success/30',
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
        color: 'text-warning',
        bg: 'bg-warning/10 border-warning/30',
      };
    return {
      label: 'Needs Info',
      color: 'text-brand-pink',
      bg: 'bg-brand-pink/10 border-brand-pink/30',
    };
  }, [percentage]);

  return (
    <>
      <Card className="relative overflow-hidden rounded-2xl border-border bg-card/80 p-5 sm:p-6 backdrop-blur-md mb-6 space-y-3.5 gap-0">
        {/* Top: Identity & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-brand-pink/10 border border-brand-pink/30 flex items-center justify-center text-brand-pink dark:bg-brand-cyan/10 dark:border-brand-cyan/30 dark:text-brand-cyan text-xl sm:text-2xl font-bold font-mono shadow-xs shrink-0">
              {personal?.name ? personal.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {personal?.name || 'Candidate Profile'}
                </h1>
                <Badge
                  variant="outline"
                  className="text-2xs font-medium px-2 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink border-brand-pink/30 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/30"
                >
                  Confirmed Facts Source
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                {personal?.title || 'Full-Stack Developer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5 shadow-xs font-medium h-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import Resume</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="text-foreground border-border bg-card hover:bg-muted text-xs gap-1.5 h-8"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>
          </div>
        </div>

        {/* Middle: Contact Info & External Links Chips in one natural flowing row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {personal?.location && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-foreground/85">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {personal.location}
            </span>
          )}
          {personal?.contact?.email && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-foreground/85">
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {personal.contact.email}
            </span>
          )}
          {personal?.contact?.phone && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-foreground/85">
              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {personal.contact.phone}
            </span>
          )}

          {personal?.links &&
            Object.entries(personal.links)
              .filter(([_, v]) => Boolean(v && v.trim()))
              .map(([k, v]) => {
                const username = extractUsername(k, v);
                const href = normalizeHref(k, v);
                return (
                  <a
                    key={k}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    title={`${k}: ${v}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-colors text-xs font-medium"
                  >
                    {getLinkIcon(k, 'w-3.5 h-3.5 text-muted-foreground shrink-0')}
                    <span>{username}</span>
                  </a>
                );
              })}
        </div>

        {/* Bottom: Streamlined Horizontal Completeness Bar */}
        <div className="bg-muted/25 border border-border/50 rounded-xl px-3.5 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Left: Indicator & Percentage */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
              <span className="text-xs font-semibold text-foreground">Completeness</span>
            </div>
            <Badge
              variant="outline"
              className={`text-2xs font-medium ${tier.bg} ${tier.color} px-1.5 py-0 rounded`}
            >
              {tier.label}
            </Badge>
            <span className="text-xs font-bold font-mono text-foreground">{percentage}%</span>
          </div>

          {/* Center: Slim Gradient Bar */}
          <div className="flex-1 max-w-xs lg:max-w-md w-full bg-muted/60 rounded-full h-1.5 overflow-hidden border border-border/30">
            <div
              className="h-full bg-linear-to-r from-brand-cyan to-brand-pink transition-all duration-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Right: Status or Actionable Suggestions */}
          <div className="shrink-0 flex items-center">
            {missingItems.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-2xs text-muted-foreground">Add:</span>
                {missingItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigateTab?.(item.tab)}
                    className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded border border-border/60 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer group"
                    title={`Add ${item.label} (+${item.weight}%)`}
                  >
                    <Circle className="w-2 h-2 text-brand-pink shrink-0" />
                    <span className="truncate max-w-28">{item.label}</span>
                    <span className="text-muted-foreground group-hover:text-brand-cyan font-mono">
                      +{item.weight}%
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-2xs text-success font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>All profile dimensions populated & ready!</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Personal Details Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-6 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit Candidate Identity & Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update your primary identification records used across generated resumes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Full Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Shahid Hasan Shuvo"
                  className="bg-muted/40 border-border text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Professional Title
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="bg-muted/40 border-border text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="bg-muted/40 border-border text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 555-0199"
                  className="bg-muted/40 border-border text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Location</label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Dhaka, Bangladesh"
                  className="bg-muted/40 border-border text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground block">
                Professional & Social Links
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  placeholder="GitHub URL"
                  className="bg-muted/40 border-border text-xs"
                />
                <Input
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  placeholder="LinkedIn URL"
                  className="bg-muted/40 border-border text-xs"
                />
                <Input
                  value={form.portfolio}
                  onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                  placeholder="Portfolio URL"
                  className="bg-muted/40 border-border text-xs"
                />
              </div>
            </div>

            <DialogFooter showCloseButton={false}>
              <DialogClose render={<Button variant="outline" size="sm" type="button" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold gap-1.5 shadow-xs"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ResumeImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={onRefresh}
      />
    </>
  );
};
