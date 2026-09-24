'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import React from 'react';
import { Card } from '@/components/ui/card';

export type PipelineStage = 'structured' | 'match' | 'strategy' | 'resume';
export type StageRunStatus = 'idle' | 'running' | 'completed' | 'failed';

interface Step {
  id: PipelineStage;
  label: string;
  shortDesc: string;
}

const STEPS: Step[] = [
  {
    id: 'structured',
    label: '1. JD Analysis',
    shortDesc: 'Extract requirements',
  },
  {
    id: 'match',
    label: '2. Candidate Match',
    shortDesc: 'True alignment check',
  },
  {
    id: 'strategy',
    label: '3. Resume Strategy',
    shortDesc: 'Angle & guidance',
  },
  { id: 'resume', label: '4. Resume & Audit', shortDesc: 'Truth-checked JSON' },
];

interface PipelineStepperProps {
  currentStage?: PipelineStage;
  completedStages: PipelineStage[];
  stageStatuses?: Partial<Record<PipelineStage, StageRunStatus>>;
  onSelectStage?: (stage: PipelineStage) => void;
  isLoading?: boolean;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  completedStages,
  stageStatuses,
  onSelectStage,
  isLoading: _isLoading = false,
}) => {
  return (
    <Card className="w-full bg-card/90 border-border rounded-2xl p-4 sm:p-5 backdrop-blur-md gap-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {STEPS.map((step, idx) => {
          const runStatus = stageStatuses?.[step.id];
          const isRunning = runStatus === 'running';
          const isFailed = runStatus === 'failed';
          const isCompleted = runStatus === 'completed' || completedStages.includes(step.id);
          const isCurrent = currentStage === step.id;

          let cardStyle = 'bg-card/40 border-border/60 opacity-60 hover:opacity-90';
          if (isRunning) {
            cardStyle =
              'bg-brand-pink/15 border-brand-pink/70 shadow-sm shadow-brand-pink/20 dark:bg-brand-cyan/15 dark:border-brand-cyan/70 dark:shadow-brand-cyan/20 animate-pulse';
          } else if (isFailed) {
            cardStyle = 'bg-destructive/10 border-destructive/50 text-destructive';
          } else if (isCurrent) {
            cardStyle =
              'bg-brand-pink/10 border-brand-pink/50 shadow-xs dark:bg-brand-cyan/10 dark:border-brand-cyan/50 dark:shadow-sm dark:shadow-brand-cyan/20';
          } else if (isCompleted) {
            cardStyle = 'bg-muted/40 border-border hover:bg-muted/70 opacity-100';
          }

          let badgeStyle = 'bg-muted text-muted-foreground';
          if (isRunning) {
            badgeStyle =
              'bg-brand-pink/20 text-brand-pink border border-brand-pink/50 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:border-brand-cyan/50';
          } else if (isFailed) {
            badgeStyle = 'bg-destructive/20 text-destructive border border-destructive/40';
          } else if (isCompleted) {
            badgeStyle = 'bg-success/10 text-success border border-success/30';
          } else if (isCurrent) {
            badgeStyle =
              'bg-brand-pink text-brand-light font-bold ring-2 ring-brand-pink/40 dark:bg-brand-cyan dark:text-brand-dark dark:ring-brand-cyan/40';
          }

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => onSelectStage?.(step.id)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${cardStyle}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${badgeStyle}`}
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFailed ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isRunning
                          ? 'text-brand-pink dark:text-brand-cyan'
                          : isFailed
                            ? 'text-destructive'
                            : isCurrent
                              ? 'text-brand-pink dark:text-brand-cyan'
                              : isCompleted
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {isRunning ? 'Processing...' : isFailed ? 'Stage failed' : step.shortDesc}
                  </p>
                </div>
              </div>

              {idx < STEPS.length - 1 && (
                <>
                  <div className="hidden sm:block w-3 lg:w-4 h-px bg-border shrink-0" />
                  <div className="block sm:hidden w-px h-3 bg-border shrink-0 mx-auto" />
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};
