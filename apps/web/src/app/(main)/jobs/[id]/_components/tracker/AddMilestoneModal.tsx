'use client';

import type { InterviewStage } from '@praman/schemas';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddMilestone } from '@/hooks/usePramanApi';
import { STAGE_PRESETS } from './constants';
import type { MilestoneFormData } from './types';

interface AddMilestoneModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AddMilestoneFormProps {
  jobId: string;
  onClose: () => void;
}

function AddMilestoneForm({ jobId, onClose }: AddMilestoneFormProps) {
  const addMilestoneMutation = useAddMilestone(jobId);

  const [form, setForm] = useState<MilestoneFormData>({
    stage: 'SCREENING',
    title: 'Recruiter Screening',
    scheduledAt: '',
    meetingLink: '',
    interviewer: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMilestoneMutation.mutateAsync({
      stage: form.stage,
      title: form.title.trim(),
      scheduledAt: form.scheduledAt || null,
      meetingLink: form.meetingLink.trim() || null,
      interviewer: form.interviewer.trim() || null,
      notes: form.notes.trim() || null,
    });
    onClose();
  };

  const isPending = addMilestoneMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Stage Preset</label>
        <Select
          value={form.stage}
          disabled={isPending}
          onValueChange={(val) => {
            if (!val) return;
            const stageVal = val as InterviewStage;
            const preset = STAGE_PRESETS.find((p) => p.stage === stageVal);
            setForm({
              ...form,
              stage: stageVal,
              title: preset?.title || form.title,
            });
          }}
        >
          <SelectTrigger className="text-xs h-9">
            <SelectValue placeholder="Select stage preset" />
          </SelectTrigger>
          <SelectContent>
            {STAGE_PRESETS.map((p) => (
              <SelectItem key={p.stage} value={p.stage} className="text-xs">
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Round Title</label>
        <Input
          value={form.title}
          disabled={isPending}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="text-xs h-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Date & Time</label>
          <Input
            type="datetime-local"
            disabled={isPending}
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="text-xs h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Interviewer(s)</label>
          <Input
            placeholder="e.g. Sarah (Lead Architect)"
            disabled={isPending}
            value={form.interviewer}
            onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
            className="text-xs h-9"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Meeting Link (Zoom / Meet)</label>
        <Input
          placeholder="https://meet.google.com/..."
          disabled={isPending}
          value={form.meetingLink}
          onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
          className="text-xs h-9"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Preparation / Key Focus</label>
        <Textarea
          placeholder="Key points or questions you plan to cover..."
          disabled={isPending}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="min-h-16 text-xs bg-muted/20 border-border"
        />
      </div>

      <DialogFooter className="pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending} className="text-xs">
          {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          <span>Add Round</span>
        </Button>
      </DialogFooter>
    </form>
  );
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({ jobId, isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-border bg-card shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Schedule Interview Round</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a round to track dates, meeting links, and tricky interview questions.
          </DialogDescription>
        </DialogHeader>

        {isOpen && <AddMilestoneForm key="add-milestone-form" jobId={jobId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
};
