'use client';

import type { InterviewMilestone, MilestoneStatus } from '@praman/schemas';
import { Calendar, ChevronDown, HelpCircle, Plus, Trash2, Users, Video } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface MilestoneCardProps {
  milestone: InterviewMilestone;
  onStatusChange: (status: MilestoneStatus) => void;
  onDelete: () => void;
  onAddQuestion: (question: string) => void;
  onRemoveQuestion: (qIdx: number) => void;
}

const MILESTONE_STATUSES: MilestoneStatus[] = [
  'SCHEDULED',
  'COMPLETED',
  'PASSED',
  'NEEDS_FOLLOW_UP',
  'CANCELLED',
];

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  SCHEDULED: 'bg-info/10 text-info border-info/30',
  COMPLETED: 'bg-success/10 text-success border-success/30',
  PASSED: 'bg-success/10 text-success border-success/30',
  NEEDS_FOLLOW_UP: 'bg-warning/10 text-warning border-warning/30',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onStatusChange,
  onDelete,
  onAddQuestion,
  onRemoveQuestion,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    onAddQuestion(newQuestion.trim());
    setNewQuestion('');
  };

  return (
    <Card className="p-4 rounded-xl border-border bg-card shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              R{milestone.roundNumber}
            </span>
            <h4 className="text-sm font-semibold text-foreground">{milestone.title}</h4>
            <Badge
              variant="outline"
              className={`text-2xs uppercase font-semibold ${STATUS_COLORS[milestone.status]}`}
            >
              {milestone.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
            {milestone.scheduledAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(milestone.scheduledAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {milestone.interviewer && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {milestone.interviewer}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 gap-1 border-border bg-card cursor-pointer"
                >
                  <span>Status</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36">
              {MILESTONE_STATUSES.map((st) => (
                <DropdownMenuItem
                  key={st}
                  onClick={() => onStatusChange(st)}
                  className="text-xs capitalize"
                >
                  {st.toLowerCase().replace('_', ' ')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {milestone.meetingLink && (
            <a
              href={milestone.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg border border-border text-primary hover:bg-muted transition-colors"
              title="Join Call"
            >
              <Video className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete round"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {milestone.notes && (
        <p className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/60">
          <span className="font-semibold text-foreground">Prep: </span>
          {milestone.notes}
        </p>
      )}

      <div className="pt-1">
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-foreground/80 hover:text-foreground flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>Questions Asked & Debrief ({milestone.questionsAsked.length})</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/20">
            {milestone.questionsAsked.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No interview questions logged yet. Record tricky questions asked during this round!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {milestone.questionsAsked.map((q, qIdx) => (
                  <li key={qIdx} className="text-xs flex items-start justify-between gap-2 group">
                    <span className="text-foreground/90">
                      <span className="text-primary font-mono font-bold mr-1.5">#{qIdx + 1}</span>
                      {q}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveQuestion(qIdx)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleQuestionSubmit} className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Log question asked by interviewer..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="text-xs h-7.5"
              />
              <Button type="submit" size="sm" variant="secondary" className="h-7.5 text-xs px-2.5">
                <Plus className="w-3 h-3 mr-1" />
                <span>Add</span>
              </Button>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
};
