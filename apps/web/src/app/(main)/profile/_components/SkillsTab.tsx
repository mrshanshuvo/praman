'use client';

import type { CreateSkillDto, Skill, SkillLevel } from '@praman/schemas';
import { ChevronLeft, ChevronRight, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const handleFilterChange = (lvl: string) => {
    setFilterLevel(lvl);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const filteredSkills = useMemo(() => {
    return skills.filter((sk) => {
      const matchesLevel = filterLevel === 'ALL' || sk.level === filterLevel;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        sk.name?.toLowerCase().includes(q) ||
        (sk.evidence && sk.evidence.toLowerCase().includes(q));
      return matchesLevel && matchesSearch;
    });
  }, [skills, filterLevel, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSkills.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSkills = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSkills.slice(start, start + pageSize);
  }, [filteredSkills, safeCurrentPage, pageSize]);

  const startItem = filteredSkills.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, filteredSkills.length);

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
          className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg p-6 bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Skill Record' : 'Add New Skill'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Specify the skill name, proficiency tier, and ground-truth evidence notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Skill Name *
              </label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Next.js, Docker, Distributed Systems"
                className="h-10 text-sm bg-muted/30 border-border focus-visible:border-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Proficiency Level *
              </label>
              <Select
                value={form.level}
                onValueChange={(val) => {
                  if (val) setForm({ ...form, level: val as SkillLevel });
                }}
              >
                <SelectTrigger className="w-full bg-muted/30 border-border text-sm h-10 cursor-pointer">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  alignItemWithTrigger={false}
                  className="bg-popover border-border text-popover-foreground shadow-xl"
                >
                  <SelectItem value="EXPERIENCED" className="text-sm py-2 cursor-pointer">
                    Experienced (Mastery / Strength)
                  </SelectItem>
                  <SelectItem value="WORKING_KNOWLEDGE" className="text-sm py-2 cursor-pointer">
                    Working Knowledge (Capable Practitioner)
                  </SelectItem>
                  <SelectItem value="LEARNING" className="text-sm py-2 cursor-pointer">
                    Learning (Growth / In Progress)
                  </SelectItem>
                  <SelectItem value="NOT_LEARNED" className="text-sm py-2 cursor-pointer">
                    Not Learned (Forbidden / Do Not Claim)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ground-Truth Evidence / Notes
                </label>
                <span className="text-2xs text-muted-foreground">Optional</span>
              </div>
              <Input
                value={form.evidence}
                onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                placeholder="e.g. Used in production microservices at Softvence"
                className="h-10 text-sm bg-muted/30 border-border focus-visible:border-brand-cyan"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border/60 gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setShowForm(false)}
                className="text-xs cursor-pointer h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="default"
                className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs cursor-pointer h-9 px-4"
              >
                {editingId ? 'Update Skill' : 'Save Skill'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={filterLevel === 'ALL' ? 'default' : 'outline'}
            size="xs"
            onClick={() => handleFilterChange('ALL')}
            className={`text-xs h-7 px-2.5 rounded-lg cursor-pointer ${
              filterLevel === 'ALL'
                ? 'bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            All ({skills.length})
          </Button>
          {SKILL_LEVELS.map((lvl) => {
            const count = skills.filter((s) => s.level === lvl).length;
            if (count === 0 && filterLevel !== lvl) return null;
            const labels: Record<SkillLevel, string> = {
              EXPERIENCED: 'Experienced',
              WORKING_KNOWLEDGE: 'Working Knowledge',
              LEARNING: 'Learning',
              NOT_LEARNED: 'Not Learned',
            };
            return (
              <Button
                key={lvl}
                type="button"
                variant={filterLevel === lvl ? 'default' : 'outline'}
                size="xs"
                onClick={() => handleFilterChange(lvl)}
                className={`text-xs h-7 px-2.5 rounded-lg cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {labels[lvl]} ({count})
              </Button>
            );
          })}
        </div>

        {skills.length > 5 && (
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search skills or notes..."
              className="pl-8 pr-7 h-7 text-xs bg-muted/30 border-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Structured Skills Table */}
      <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs text-muted-foreground py-2.5 px-4 w-[28%]">
                Skill
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-2.5 px-4 w-[22%]">
                Level
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-2.5 px-4">
                Evidence / Ground-Truth Notes
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-2.5 px-4 text-right w-24">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSkills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-xs">
                  {skills.length === 0
                    ? 'No skills added yet. Click "Add Skill" above to get started.'
                    : 'No skills match the selected filter.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedSkills.map((sk) => (
                <TableRow
                  key={sk.id}
                  className="hover:bg-muted/30 transition-colors group border-b border-border/50 last:border-0"
                >
                  <TableCell className="font-semibold text-xs text-foreground px-4 py-3 align-middle">
                    {sk.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle">
                    <SkillLevelBadge level={sk.level} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-normal max-w-md px-4 py-3 align-middle leading-relaxed">
                    {sk.evidence ? (
                      sk.evidence
                    ) : (
                      <span className="text-muted-foreground/40 italic text-2xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right align-middle">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleStartEdit(sk)}
                        className="text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 p-1 cursor-pointer"
                        title="Edit skill"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDelete(sk.id, sk.name)}
                        className="text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/10 p-1 cursor-pointer"
                        title="Delete skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {filteredSkills.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-t border-border/70 bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <strong className="text-foreground">{startItem}</strong>–
              <strong className="text-foreground">{endItem}</strong> of{' '}
              <strong className="text-foreground">{filteredSkills.length}</strong> skills
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-muted/40 border border-border rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer focus:outline-none"
                >
                  <option value={10} className="bg-popover text-popover-foreground">
                    10
                  </option>
                  <option value={20} className="bg-popover text-popover-foreground">
                    20
                  </option>
                  <option value={50} className="bg-popover text-popover-foreground">
                    50
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="h-7 px-2 text-xs border-border cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                  <span>Prev</span>
                </Button>
                <span className="px-2 text-xs font-mono text-muted-foreground min-w-14 text-center">
                  {safeCurrentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-7 px-2 text-xs border-border cursor-pointer disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
