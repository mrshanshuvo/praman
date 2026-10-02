'use client';

import type { CandidatePersonal, UpdateCandidatePersonal } from '@praman/schemas';
import { Award, Check, CheckCircle2, Edit2, RefreshCw, Sparkles, User } from 'lucide-react';
import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

interface PersonalTabProps {
  personal?: CandidatePersonal | null;
  onUpdate?: (personal: UpdateCandidatePersonal) => Promise<void>;
}

export function PersonalTab({ personal, onUpdate }: PersonalTabProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    summary: personal?.summary || '',
    bio: personal?.bio || '',
    achievements: (personal?.achievements || []).join('\n'),
    languages: (personal?.languages || []).join(', '),
  });

  const handleOpenEdit = () => {
    setForm({
      summary: personal?.summary || '',
      bio: personal?.bio || '',
      achievements: (personal?.achievements || []).join('\n'),
      languages: (personal?.languages || []).join(', '),
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      const achievements = form.achievements
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean);
      const languages = form.languages
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      await onUpdate({
        ...personal,
        name: personal?.name || '',
        summary: form.summary.trim(),
        bio: form.bio.trim() || undefined,
        achievements,
        languages,
      });
      setIsEditOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Summary & Bio</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal overview, key achievements, and language proficiencies
          </p>
        </div>
        {onUpdate && (
          <Button
            onClick={handleOpenEdit}
            variant="outline"
            size="sm"
            className="gap-1.5 border-border hover:border-brand-pink/50 dark:hover:border-brand-cyan/50 text-xs font-medium"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Summary & Bio</span>
          </Button>
        )}
      </div>

      <Card className="rounded-xl border-border bg-card/80 p-6 gap-0">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-success" />
          Professional Summary
        </h3>
        <p className="text-sm text-foreground/90 leading-relaxed font-sans">
          {personal?.summary || 'No summary registered.'}
        </p>
      </Card>

      {personal?.bio && (
        <Card className="rounded-xl border-border bg-card/80 p-6 gap-0">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            Bio & Headline
          </h3>
          <p className="text-sm text-foreground/90 leading-relaxed font-sans italic">
            "{personal.bio}"
          </p>
        </Card>
      )}

      {personal?.achievements && personal.achievements.length > 0 && (
        <Card className="rounded-xl border-border bg-card/80 p-6 gap-0">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-pink" />
            Key Achievements & Recognition
          </h3>
          <ul className="space-y-2">
            {personal.achievements.map((ach: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90"
              >
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>{ach}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {personal?.languages && (
        <Card className="rounded-xl border-border bg-card/80 p-6 gap-0">
          <h3 className="text-sm font-semibold text-foreground mb-3">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {personal.languages.map((lang: string, i: number) => (
              <Badge
                key={i}
                variant="outline"
                className="px-3 py-1 text-xs bg-muted border-border text-muted-foreground"
              >
                {lang}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Summary & Bio Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl bg-card border-border p-6 sm:p-7 gap-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit Summary & Achievements
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update your high-level candidate summary, highlight bullet points, and spoken
              languages.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Short Bio / Headline (Optional)
              </label>
              <Input
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="e.g. Senior Full-Stack Engineer specializing in high-performance distributed systems"
                className="bg-muted/40 border-border text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Professional Summary
              </label>
              <Textarea
                rows={5}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Brief synthesis of your career trajectory and technical strengths..."
                className="bg-muted/40 border-border text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Key Achievements (One per line)
                </label>
                <span className="text-2xs text-muted-foreground">One bullet point per line</span>
              </div>
              <Textarea
                rows={5}
                value={form.achievements}
                onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                placeholder="VC's & Dean's List Scholarship (2022–2025)&#10;ICPC & IDPC Competitor&#10;Top 4% globally on BeeCrowd (321.11 points)"
                className="bg-muted/40 border-border text-sm font-mono leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Languages (Comma-separated)
              </label>
              <Input
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
                placeholder="English (Fluent), Bengali (Native), German (B1)"
                className="bg-muted/40 border-border text-sm h-10"
              />
            </div>

            <DialogFooter showCloseButton={false} className="pt-2">
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
    </div>
  );
}
