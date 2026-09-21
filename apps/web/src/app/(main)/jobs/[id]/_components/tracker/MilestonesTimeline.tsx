'use client';

import type { InterviewMilestone, MilestoneStatus } from '@praman/schemas';
import { Calendar, Layers, Plus } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDeleteMilestone, useUpdateMilestone } from '@/hooks/usePramanApi';
import { MilestoneCard } from './MilestoneCard';

interface MilestonesTimelineProps {
  jobId: string;
  milestones: InterviewMilestone[];
  onOpenAddRound: () => void;
}

export const MilestonesTimeline: React.FC<MilestonesTimelineProps> = ({
  jobId,
  milestones,
  onOpenAddRound,
}) => {
  const updateMilestoneMutation = useUpdateMilestone(jobId);
  const deleteMilestoneMutation = useDeleteMilestone(jobId);

  const handleUpdateStatus = (milestoneId: string, newStatus: MilestoneStatus) => {
    updateMilestoneMutation.mutate({
      milestoneId,
      data: { status: newStatus },
    });
  };

  const handleAddQuestion = (milestone: InterviewMilestone, question: string) => {
    const questions = [...milestone.questionsAsked, question];
    updateMilestoneMutation.mutate({
      milestoneId: milestone.id,
      data: { questionsAsked: questions },
    });
  };

  const handleRemoveQuestion = (milestone: InterviewMilestone, qIdx: number) => {
    const questions = milestone.questionsAsked.filter((_, idx) => idx !== qIdx);
    updateMilestoneMutation.mutate({
      milestoneId: milestone.id,
      data: { questionsAsked: questions },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">Interview Milestones & Rounds</h3>
          <Badge variant="outline" className="text-xs font-mono ml-1">
            {milestones.length}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAddRound}
          className="text-xs gap-1.5 border-border bg-card hover:bg-muted"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Round</span>
        </Button>
      </div>

      {milestones.length === 0 ? (
        <Card className="p-8 rounded-2xl border-dashed border-border bg-muted/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">No interview rounds added yet</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Log your screening calls, technical challenges, and hiring manager rounds to track
              your progress and interview questions.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onOpenAddRound} className="text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule First Round</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onStatusChange={(newStatus) => handleUpdateStatus(milestone.id, newStatus)}
              onDelete={() => deleteMilestoneMutation.mutate(milestone.id)}
              onAddQuestion={(q) => handleAddQuestion(milestone, q)}
              onRemoveQuestion={(qIdx) => handleRemoveQuestion(milestone, qIdx)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
