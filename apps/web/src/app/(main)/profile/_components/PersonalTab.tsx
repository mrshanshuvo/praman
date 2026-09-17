'use client';

import { Award, Check, CheckCircle2, Edit2, RefreshCw, User } from 'lucide-react';
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
  personal: any;
  onUpdate?: (personal: any) => Promise<void>;
}

export function PersonalTab({ personal = {}, onUpdate }: PersonalTabProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    summary: personal.summary || '',
    achievements: (personal.achievements || []).join('\n'),
    languages: (personal.languages || []).join(', '),
  });

  const handleOpenEdit = () => {
    setForm({
      summary: personal.summary || '',
      achievements: (personal.achievements || []).join('\n'),
      languages: (personal.languages || []).join(', '),
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
        summary: form.summary,
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
          {personal.summary || 'No summary registered.'}
        </p>
      </Card>

      {personal.achievements && personal.achievements.length > 0 && (
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

      {personal.languages && (
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
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Edit Summary & Achievements
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update your high-level candidate summary, highlight bullet points, and spoken
              languages.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Professional Summary
              </label>
              <Textarea
                rows={4}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Brief synthesis of your career trajectory and technical strengths..."
                className="bg-muted/40 border-border text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Key Achievements (One per line)
              </label>
              <Textarea
                rows={4}
                value={form.achievements}
                onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                placeholder="Led 40% latency reduction across ingestion pipelines&#10;Published IEEE paper on zero-knowledge attestation"
                className="bg-muted/40 border-border text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Languages (Comma-separated)
              </label>
              <Input
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
                placeholder="English (Fluent), Bengali (Native), German (B1)"
                className="bg-muted/40 border-border text-xs"
              />
            </div>

            <DialogFooter showCloseButton={false}>
              <DialogClose render={<Button variant="outline" size="sm" type="button" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-brand-pink hover:bg-brand-pink/90 text-white font-semibold gap-1.5 shadow-xs"
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
