'use client';

import type { Certification, CreateCertificationDto } from '@praman/schemas';
import { Award, Edit2, Plus, Trash2 } from 'lucide-react';
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

interface CertificationsTabProps {
  certifications: Certification[];
  onAdd: (payload: CreateCertificationDto) => Promise<void>;
  onUpdate?: (id: string, payload: Partial<CreateCertificationDto>) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
}

const EMPTY_CERT = {
  name: '',
  issuer: '',
  date: '',
};

export function CertificationsTab({
  certifications,
  onAdd,
  onUpdate,
  onDelete,
}: CertificationsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CERT);

  const handleStartAdd = () => {
    setEditingId(null);
    setForm(EMPTY_CERT);
    setShowModal(true);
  };

  const handleStartEdit = (cert: Certification) => {
    setEditingId(cert.id);
    setForm({
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.date || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const payload: CreateCertificationDto = {
      name: form.name.trim(),
      issuer: form.issuer ? form.issuer.trim() : null,
      date: form.date ? form.date.trim() : null,
    };

    if (editingId && onUpdate) {
      await onUpdate(editingId, payload);
    } else {
      await onAdd(payload);
    }

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_CERT);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Training & Certifications</h3>
          <p className="text-xs text-muted-foreground">
            Professional certifications, training programs, and verified accreditations.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStartAdd}
          className="bg-brand-pink hover:bg-brand-pink/90 text-brand-light dark:bg-brand-cyan dark:hover:bg-brand-cyan/90 dark:text-brand-dark font-medium shadow-sm shadow-brand-pink/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certification</span>
        </Button>
      </div>

      {certifications.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">No certifications added yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Showcase your credentials, licenses, bootcamps, and competitive achievements.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStartAdd}
            className="mt-2 text-xs border-border hover:border-brand-cyan/40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Certification
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <Card
              key={cert.id}
              className="p-4 border-border bg-card hover:border-brand-pink/50 dark:hover:border-brand-cyan/40 transition flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground leading-snug">{cert.name}</h4>
                  {cert.issuer && (
                    <p className="text-xs text-brand-pink dark:text-brand-cyan font-medium">
                      Issuer: {cert.issuer}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {cert.date && (
                    <Badge
                      variant="outline"
                      className="text-xs font-mono text-muted-foreground bg-muted/60 border-border"
                    >
                      {cert.date}
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleStartEdit(cert)}
                    className="text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition"
                    title="Edit certification"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDelete(cert.id, cert.name)}
                    className="text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/10 transition"
                    title="Delete certification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Certification Add/Edit Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingId(null);
            setForm(EMPTY_CERT);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl md:max-w-2xl bg-card border-border p-6 sm:p-7 gap-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingId ? 'Edit Certification' : 'New Certification'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingId
                ? 'Update your certificate or training record.'
                : 'Add a verified certification or training program to your profile.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Certification Name *
              </label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Next Level Web Development (Next.js, Node.js, System Design)"
                className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Issuer / Organization
                </label>
                <Input
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  placeholder="e.g. Programming Hero, AWS, Google"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Issue Date / Year
                </label>
                <Input
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  placeholder="e.g. 2026 or 2026-05"
                  className="bg-muted/40 border-border text-sm h-10 focus-visible:border-brand-cyan"
                />
              </div>
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
                      setForm(EMPTY_CERT);
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
                {editingId ? 'Update Certification' : 'Save Certification'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
