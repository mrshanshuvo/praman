'use client';

import type { ApplicationTracker } from '@praman/schemas';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
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
import { useUpdateTrackerDossier } from '@/hooks/usePramanApi';
import type { DossierFormData } from './types';

interface EditDossierModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  tracker?: ApplicationTracker | null;
}

interface EditDossierFormProps {
  jobId: string;
  initialData?: ApplicationTracker | null;
  onClose: () => void;
}

function EditDossierForm({ jobId, initialData, onClose }: EditDossierFormProps) {
  const updateDossierMutation = useUpdateTrackerDossier(jobId);

  // React 19 pattern: Form state initialized directly on mount via key, 0 useEffects
  const [formData, setFormData] = useState<DossierFormData>({
    appliedDate: initialData?.appliedDate || '',
    portalUrl: initialData?.portalUrl || '',
    targetSalary: initialData?.targetSalary || '',
    referralContact: initialData?.referralContact || '',
    recruiterName: initialData?.recruiterName || '',
    recruiterEmail: initialData?.recruiterEmail || '',
    recruiterPhone: initialData?.recruiterPhone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDossierMutation.mutateAsync({
      appliedDate: formData.appliedDate.trim() || undefined,
      portalUrl: formData.portalUrl.trim() || undefined,
      targetSalary: formData.targetSalary.trim() || undefined,
      referralContact: formData.referralContact.trim() || undefined,
      recruiterName: formData.recruiterName.trim() || undefined,
      recruiterEmail: formData.recruiterEmail.trim() || undefined,
      recruiterPhone: formData.recruiterPhone.trim() || undefined,
    });
    onClose();
  };

  const isPending = updateDossierMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Applied Date</label>
          <Input
            type="date"
            disabled={isPending}
            value={formData.appliedDate}
            onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
            className="text-xs h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Target Compensation</label>
          <Input
            placeholder="e.g. $160,000 / yr"
            disabled={isPending}
            value={formData.targetSalary}
            onChange={(e) => setFormData({ ...formData, targetSalary: e.target.value })}
            className="text-xs h-9"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Applicant Portal Link</label>
        <Input
          placeholder="https://company.greenhouse.io/..."
          disabled={isPending}
          value={formData.portalUrl}
          onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
          className="text-xs h-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Recruiter Name</label>
          <Input
            placeholder="Jane Doe"
            disabled={isPending}
            value={formData.recruiterName}
            onChange={(e) => setFormData({ ...formData, recruiterName: e.target.value })}
            className="text-xs h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Recruiter Email</label>
          <Input
            placeholder="jane@company.com"
            disabled={isPending}
            value={formData.recruiterEmail}
            onChange={(e) => setFormData({ ...formData, recruiterEmail: e.target.value })}
            className="text-xs h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Recruiter Phone</label>
          <Input
            placeholder="(555) 123-4567"
            disabled={isPending}
            value={formData.recruiterPhone}
            onChange={(e) => setFormData({ ...formData, recruiterPhone: e.target.value })}
            className="text-xs h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Internal Referral</label>
          <Input
            placeholder="Referred by Alex M."
            disabled={isPending}
            value={formData.referralContact}
            onChange={(e) => setFormData({ ...formData, referralContact: e.target.value })}
            className="text-xs h-9"
          />
        </div>
      </div>

      <DialogFooter className="pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending} className="text-xs">
          {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          <span>Save Changes</span>
        </Button>
      </DialogFooter>
    </form>
  );
}

export const EditDossierModal: React.FC<EditDossierModalProps> = ({
  jobId,
  isOpen,
  onClose,
  tracker,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-border bg-card shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Application Details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Keep recruiter contact info, salary discussions, and portal links organized.
          </DialogDescription>
        </DialogHeader>

        {isOpen && (
          <EditDossierForm
            key={tracker?.appliedDate ?? 'dossier-form'}
            jobId={jobId}
            initialData={tracker}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
