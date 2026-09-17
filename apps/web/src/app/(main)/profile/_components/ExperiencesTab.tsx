'use client';

import { Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ExperiencesTabProps {
  experiences: any[];
  onAdd: (payload: any) => Promise<void>;
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

export function ExperiencesTab({ experiences, onAdd, onDelete }: ExperiencesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_EXP);

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
    await onAdd(payload);
    setShowForm(false);
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
          onClick={() => setShowForm(true)}
          className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 border-brand-pink/40 dark:border-brand-cyan/40 bg-card/90 gap-4">
          <h4 className="text-sm font-semibold text-brand-pink dark:text-brand-cyan">
            New Experience Record
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Company *</label>
                <Input
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Softvence Agency"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title *</label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Jr. Full Stack Developer"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
                <Input
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  placeholder="e.g. 2026-08"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">End Date</label>
                <Input
                  disabled={form.isCurrent}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  placeholder="e.g. 2026-07"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan disabled:opacity-40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCurrent"
                checked={form.isCurrent}
                onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
                className="rounded border-border text-brand-cyan focus:ring-brand-cyan bg-muted/40"
              />
              <label
                htmlFor="isCurrent"
                className="text-xs text-foreground cursor-pointer select-none"
              >
                Currently working here
              </label>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Responsibilities (one per line)
              </label>
              <Textarea
                rows={3}
                value={form.responsibilities}
                onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                placeholder="Developed production applications using Next.js..."
                className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan min-h-20"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Technologies (comma separated)
              </label>
              <Input
                value={form.technologies}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                placeholder="Next.js, TypeScript, PostgreSQL"
                className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20"
              >
                Save Experience
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {experiences.map((exp: any) => (
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
              <div className="flex items-center gap-2">
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
                  onClick={() => onDelete(exp.id, exp.company)}
                  className="text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/10 transition"
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
