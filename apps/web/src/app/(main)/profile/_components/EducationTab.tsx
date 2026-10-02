'use client';

import type { CreateEducationDto, Education } from '@praman/schemas';
import { Edit2, GraduationCap, Plus, Trash2 } from 'lucide-react';
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

interface EducationTabProps {
  educations: Education[];
  onAdd: (payload: CreateEducationDto) => Promise<void>;
  onUpdate?: (id: string, payload: Partial<CreateEducationDto>) => Promise<void>;
  onDelete: (id: string, institution: string) => Promise<void>;
}

const EMPTY_EDU = {
  institution: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  details: '',
};

export function EducationTab({ educations, onAdd, onUpdate, onDelete }: EducationTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EDU);

  const handleStartAdd = () => {
    setEditingId(null);
    setForm(EMPTY_EDU);
    setShowModal(true);
  };

  const handleStartEdit = (edu: Education) => {
    setEditingId(edu.id);
    setForm({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      details: edu.details || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.institution || !form.degree) return;

    const payload: CreateEducationDto = {
      institution: form.institution.trim(),
      degree: form.degree.trim(),
      field: form.field ? form.field.trim() : null,
      startDate: form.startDate ? form.startDate.trim() : null,
      endDate: form.endDate ? form.endDate.trim() : null,
      details: form.details ? form.details.trim() : null,
    };

    if (editingId && onUpdate) {
      await onUpdate(editingId, payload);
    } else {
      await onAdd(payload);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_EDU);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Academic Education</h3>
          <p className="text-xs text-muted-foreground">
            Degrees, academic institutions, and coursework milestones.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStartAdd}
          className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </Button>
      </div>

      {educations.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">No education history recorded</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Add your degrees, institutions, and academic achievements to complete your candidate profile.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartAdd}
            className="mt-2 text-xs border-border hover:border-brand-cyan/40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Degree
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {educations.map((edu) => (
            <Card
              key={edu.id}
              className="p-5 border-border bg-card hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition gap-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-base font-semibold text-foreground">{edu.institution}</h4>
                  <p className="text-sm text-brand-pink dark:text-brand-cyan font-medium mt-0.5">
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(edu.startDate || edu.endDate) && (
                    <Badge
                      variant="outline"
                      className="text-xs font-mono text-muted-foreground bg-muted/60 border-border"
                    >
                      {edu.startDate || ''}
                      {edu.startDate && edu.endDate ? ' — ' : ''}
                      {edu.endDate || ''}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleStartEdit(edu)}
                      className="text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition"
                      title="Edit education"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(edu.id, edu.institution)}
                      className="text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/10 transition"
                      title="Delete education"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              {edu.details && (
                <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
                  {edu.details}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Education Add/Edit Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingId(null);
            setForm(EMPTY_EDU);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl md:max-w-3xl bg-card border-border p-6 sm:p-7 gap-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Education Record' : 'New Education Record'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingId
                ? 'Update your academic credentials, dates, and honors.'
                : 'Add a degree or academic institution to your candidate profile.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Institution *</label>
                <Input
                  required
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="e.g. Green University of Bangladesh"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Degree *</label>
                <Input
                  required
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  placeholder="e.g. B.Sc., Master of Science, High School"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Field of Study</label>
              <Input
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                placeholder="e.g. Computer Science & Engineering"
                className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Start Date</label>
                <Input
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  placeholder="e.g. 2022-01"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">End Date</label>
                <Input
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  placeholder="e.g. 2026-01 or Present"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Details & Highlights (Optional)
                </label>
                <span className="text-2xs text-muted-foreground">CGPA, honors, scholarships</span>
              </div>
              <Textarea
                rows={3}
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="e.g. CGPA: 3.76 / 4.00. VC's & Dean's List Scholarship (2022–2025)."
                className="bg-muted/40 border-border text-sm leading-relaxed"
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
                      setShowModal(false);
                      setEditingId(null);
                      setForm(EMPTY_EDU);
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
                {editingId ? 'Update Education' : 'Save Education'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
