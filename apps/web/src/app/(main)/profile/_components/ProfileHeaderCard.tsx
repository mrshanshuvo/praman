'use client';

import type { CandidatePersonal, UpdateCandidatePersonal } from '@praman/schemas';
import { Check, Edit2, Globe, Mail, MapPin, Phone, RefreshCw, Sparkles } from 'lucide-react';
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
import { ResumeImportModal } from './ResumeImportModal';

interface ProfileHeaderCardProps {
  personal?: CandidatePersonal | null;
  isFetching: boolean;
  onRefresh: () => void;
  onUpdatePersonal: (personal: UpdateCandidatePersonal) => Promise<void>;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  personal,
  isFetching,
  onRefresh,
  onUpdatePersonal,
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

  return (
    <>
      <Card className="relative overflow-hidden rounded-2xl border-border bg-card/80 p-6 sm:p-8 backdrop-blur-md mb-8 gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-pink/10 border border-brand-pink/30 flex items-center justify-center text-brand-pink dark:bg-brand-cyan/10 dark:border-brand-cyan/30 dark:text-brand-cyan text-2xl font-bold font-mono shadow-xs shrink-0">
              {personal?.name ? personal.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {personal?.name || 'Candidate Profile'}
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-pink/10 text-brand-pink border-brand-pink/30 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/30"
                >
                  Confirmed Facts Source
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                {personal?.title || 'Full-Stack Developer'}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-3">
                {personal?.location && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground/85">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {personal.location}
                  </span>
                )}
                {personal?.contact?.email && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground/85">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {personal.contact.email}
                  </span>
                )}
                {personal?.contact?.phone && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/70 text-foreground/85">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {personal.contact.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5 shadow-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import Resume</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="text-foreground border-border bg-card hover:bg-muted text-xs gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
              className="text-foreground border-border bg-card hover:bg-muted text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* External links */}
        {personal?.links && Object.keys(personal.links).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-border">
            {Object.entries(personal.links).map(([k, v]) => (
              <a
                key={k}
                href={v}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="capitalize">{k}</span>
              </a>
            ))}
          </div>
        )}
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
