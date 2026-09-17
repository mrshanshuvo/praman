'use client';

import { Edit2, ExternalLink, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProjectsTabProps {
  projects: any[];
  onAdd: (payload: any) => Promise<void>;
  onUpdate?: (id: string, payload: any) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
}

const EMPTY_PROJECT = {
  name: '',
  description: '',
  technologies: '',
  role: '',
  outcomes: '',
  link: '',
};

export function ProjectsTab({ projects, onAdd, onUpdate, onDelete }: ProjectsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PROJECT);

  const handleStartAdd = () => {
    setEditingId(null);
    setForm(EMPTY_PROJECT);
    setShowForm(true);
  };

  const handleStartEdit = (proj: any) => {
    setEditingId(proj.id);
    setForm({
      name: proj.name || '',
      description: proj.description || '',
      role: proj.role || '',
      link: proj.link || '',
      technologies: (proj.technologies || []).join(', '),
      outcomes: (proj.outcomes || []).join('\n'),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const payload = {
      name: form.name,
      description: form.description,
      role: form.role || null,
      link: form.link || null,
      technologies: form.technologies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      outcomes: form.outcomes
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
    setForm(EMPTY_PROJECT);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Projects</h3>
          <p className="text-xs text-muted-foreground">
            Verified portfolio projects used as evidence anchors for resume bullets.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStartAdd}
          className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 border-brand-pink/40 dark:border-brand-cyan/40 bg-card gap-4">
          <h4 className="text-sm font-semibold text-brand-pink dark:text-brand-cyan">
            {editingId ? 'Edit Project Anchor' : 'New Project Anchor'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Project Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. CareCamp"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Role</label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Full-Stack Developer"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Description *</label>
              <Textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Full-stack medical management platform..."
                className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan min-h-16 text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Technologies (comma separated)
                </label>
                <Input
                  value={form.technologies}
                  onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                  placeholder="React, Node.js, MongoDB"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Live or Code Link
                </label>
                <Input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Outcomes & Metrics (one per line)
              </label>
              <Textarea
                rows={2}
                value={form.outcomes}
                onChange={(e) => setForm({ ...form, outcomes: e.target.value })}
                placeholder="Engineered full-stack medical platform with responsive dashboards..."
                className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan min-h-16 text-foreground"
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
                {editingId ? 'Update Project' : 'Save Project'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {projects.map((proj: any) => (
          <Card
            key={proj.id}
            className="p-5 border-border bg-card hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition gap-0"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-base font-semibold text-foreground">{proj.name}</h4>
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-pink dark:text-brand-cyan hover:underline flex items-center gap-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" /> Live
                    </a>
                  )}
                </div>
                {proj.role && (
                  <p className="text-sm text-muted-foreground mt-0.5">Role: {proj.role}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-muted-foreground bg-muted/60 border-border px-2 py-0.5"
                >
                  ID: {proj.id.slice(0, 8)}...
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleStartEdit(proj)}
                  className="text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition"
                  title="Edit project"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(proj.id, proj.name)}
                  className="text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/10 transition"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
              {proj.description}
            </p>

            {proj.outcomes && proj.outcomes.length > 0 && (
              <div className="mt-3.5 space-y-1.5">
                {proj.outcomes.map((out: string, oIdx: number) => (
                  <p
                    key={oIdx}
                    className="text-sm text-muted-foreground pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-brand-pink dark:before:text-brand-cyan leading-relaxed"
                  >
                    {out}
                  </p>
                ))}
              </div>
            )}

            {proj.technologies && proj.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                {proj.technologies.map((tech: string, tIdx: number) => (
                  <span
                    key={tIdx}
                    className="text-xs font-mono px-2.5 py-0.5 rounded bg-muted/70 border border-border text-foreground"
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
