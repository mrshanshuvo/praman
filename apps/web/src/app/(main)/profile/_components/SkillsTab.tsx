'use client';

import type { CreateSkillDto, Skill, SkillLevel } from '@praman/schemas';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SkillLevelBadge } from './SkillLevelBadge';

interface SkillsTabProps {
  skills: Skill[];
  onAdd: (payload: CreateSkillDto) => Promise<void>;
  onUpdate?: (id: string, payload: Partial<CreateSkillDto>) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
}

const SKILL_LEVELS: SkillLevel[] = ['EXPERIENCED', 'WORKING_KNOWLEDGE', 'LEARNING', 'NOT_LEARNED'];
const EMPTY_SKILL = {
  name: '',
  level: 'EXPERIENCED' as SkillLevel,
  evidence: '',
};

export function SkillsTab({ skills, onAdd, onUpdate, onDelete }: SkillsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_SKILL);

  const handleStartAdd = () => {
    setEditingId(null);
    setForm(EMPTY_SKILL);
    setShowForm(true);
  };

  const handleStartEdit = (sk: Skill) => {
    setEditingId(sk.id);
    setForm({
      name: sk.name || '',
      level: sk.level || 'EXPERIENCED',
      evidence: sk.evidence || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId && onUpdate) {
      await onUpdate(editingId, form);
    } else {
      await onAdd(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_SKILL);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Skills & Competencies</h3>
          <p className="text-xs text-muted-foreground">
            Categorized skills and proficiency levels used for resume generation.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStartAdd}
          className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 border-brand-pink/40 dark:border-brand-cyan/40 bg-card/90 gap-3">
          <h4 className="text-sm font-semibold text-brand-pink dark:text-brand-cyan">
            {editingId ? 'Edit Skill Record' : 'New Skill Record'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Skill Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Next.js"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Level *</label>
                <Select
                  value={form.level}
                  onValueChange={(val) => {
                    if (val) setForm({ ...form, level: val as SkillLevel });
                  }}
                >
                  <SelectTrigger className="w-full bg-muted/40 border-border text-xs h-8">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {SKILL_LEVELS.map((l) => (
                      <SelectItem
                        key={l}
                        value={l}
                        className="text-xs focus:bg-muted focus:text-brand-cyan"
                      >
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Evidence / Notes</label>
                <Input
                  value={form.evidence}
                  onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                  placeholder="e.g. Used in Softvence production apps"
                  className="bg-muted/40 border-border text-xs focus-visible:border-brand-cyan"
                />
              </div>
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
                {editingId ? 'Update Skill' : 'Save Skill'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Grouped by Level */}
      {SKILL_LEVELS.map((level) => {
        const group = skills.filter((s) => s.level === level);
        if (group.length === 0) return null;
        return (
          <div key={level} className="space-y-3">
            <div className="flex items-center gap-2">
              <SkillLevelBadge level={level} />
              <span className="text-xs text-muted-foreground">({group.length} skills)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.map((sk) => (
                <Card
                  key={sk.id}
                  className="p-3 border-border bg-card/80 hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 flex flex-row items-start justify-between gap-2 group transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{sk.name}</p>
                    {sk.evidence && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {sk.evidence}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleStartEdit(sk)}
                      className="text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 p-1"
                      title="Edit skill"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(sk.id, sk.name)}
                      className="text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/10 p-1"
                      title="Delete skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
