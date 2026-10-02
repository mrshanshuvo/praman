'use client';

import type { CreateExperienceDto, Experience } from '@praman/schemas';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
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

interface ExperiencesTabProps {
  experiences: Experience[];
  onAdd: (payload: CreateExperienceDto) => Promise<void>;
  onUpdate?: (id: string, payload: Partial<CreateExperienceDto>) => Promise<void>;
  onDelete: (id: string, company: string) => Promise<void>;
}

const EMPTY_EXP = {
  company: '',
  title: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  responsibilities: '',
  technologies: '',
  achievements: '',
};

export function ExperiencesTab({ experiences, onAdd, onUpdate, onDelete }: ExperiencesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EXP);

  const handleStartAdd = () => {
    setEditingId(null);
    setForm(EMPTY_EXP);
    setShowForm(true);
  };

  const handleStartEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setForm({
      company: exp.company || '',
      title: exp.title || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      isCurrent: Boolean(exp.isCurrent),
      responsibilities: (exp.responsibilities || []).join('\n'),
      technologies: (exp.technologies || []).join(', '),
      achievements: (exp.achievements || []).join('\n'),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.title) return;
    const payload = {
      company: form.company,
      title: form.title,
      startDate: form.startDate || null,
      endDate: form.isCurrent ? null : form.endDate || null,
      isCurrent: form.isCurrent,
      responsibilities: form.responsibilities
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      technologies: form.technologies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      achievements: form.achievements
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (editingId && onUpdate) {
      await onUpdate(editingId, payload);
    } else {
      await onAdd(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_EXP);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Work Experience</h3>
          <p className="text-xs text-muted-foreground">
            Verifiable employment records. Every bullet is an atomic truth anchor.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStartAdd}
          className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </Button>
      </div>

      {/* Experience Add/Edit Modal */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingId(null);
            setForm(EMPTY_EXP);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl md:max-w-3xl bg-card border-border p-6 sm:p-7 gap-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Experience Record' : 'New Experience Record'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingId
                ? 'Update your verifiable employment record and atomic truth anchors.'
                : 'Add a verifiable employment record to your profile.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Company *</label>
                <Input
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Softvence Agency"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Title *</label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Jr. Full Stack Developer"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Start Date</label>
                <Input
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  placeholder="e.g. 2026-08"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">End Date</label>
                <Input
                  disabled={form.isCurrent}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  placeholder={form.isCurrent ? 'Present' : 'e.g. 2026-07'}
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan disabled:opacity-40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                type="checkbox"
                id="isCurrent"
                checked={form.isCurrent}
                onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
                className="w-4 h-4 rounded border-border text-brand-cyan focus:ring-brand-cyan bg-muted/40 accent-brand-cyan cursor-pointer"
              />
              <label
                htmlFor="isCurrent"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                Currently working here
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Responsibilities (one per line)
                </label>
                <span className="text-2xs text-muted-foreground">Each line becomes an anchor bullet</span>
              </div>
              <Textarea
                rows={4}
                value={form.responsibilities}
                onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                placeholder="Developing production applications using Next.js, TypeScript, Node.js...&#10;Building AI-powered features and integrations..."
                className="bg-muted/40 border-border text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Key Achievements (one per line, optional)
                </label>
                <span className="text-2xs text-muted-foreground">Measurable milestones or awards</span>
              </div>
              <Textarea
                rows={3}
                value={form.achievements}
                onChange={(e) => setForm({ ...form, achievements: e.target.value })}
                placeholder="Reduced API latency by 45% using Redis caching...&#10;Promoted to lead engineer within 6 months..."
                className="bg-muted/40 border-border text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Technologies (comma separated)
              </label>
              <Input
                value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                placeholder="Next.js, TypeScript, PostgreSQL, Docker, JWT"
                className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <DialogClose
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm(EMPTY_EXP);
                    }}
                  />
                }
              >
                Cancel
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-semibold gap-1.5 shadow-xs"
              >
                {editingId ? 'Update Experience' : 'Save Experience'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {experiences.map((exp) => (
          <Card
            key={exp.id}
            className="p-5 border-border bg-card/80 hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition gap-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-foreground">{exp.title}</h4>
                  <span className="text-sm text-brand-pink dark:text-brand-cyan font-medium">
                    @ {exp.company}
                  </span>
                  {exp.isCurrent && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-brand-pink/15 text-brand-pink border-brand-pink/40 font-medium px-2 py-0.5"
                    >
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-muted-foreground bg-muted/60 border-border px-2 py-0.5"
                >
                  ID: {exp.id.slice(0, 8)}...
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleStartEdit(exp)}
                  className="text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition"
                  title="Edit experience"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(exp.id, exp.company)}
                  className="text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/10 transition"
                  title="Delete experience"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              {exp.responsibilities?.map((bullet: string, bIdx: number) => (
                <p
                  key={bIdx}
                  className="text-sm text-foreground/90 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-brand-pink dark:before:text-brand-cyan leading-relaxed"
                >
                  {bullet}
                </p>
              ))}
            </div>

            {exp.technologies && exp.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                {exp.technologies.map((tech: string, tIdx: number) => (
                  <span
                    key={tIdx}
                    className="text-xs font-mono px-2.5 py-0.5 rounded bg-muted border border-border text-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
