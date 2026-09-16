'use client';

import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import { Card } from '@/components/ui/card';

export type PipelineStage = 'structured' | 'match' | 'strategy' | 'resume';

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
  onSelectStage?: (stage: PipelineStage) => void;
  isLoading?: boolean;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  currentStage,
  completedStages,
  onSelectStage,
  isLoading: _isLoading = false,
}) => {
  return (
    <Card className="w-full bg-card/90 border-border rounded-2xl p-4 sm:p-5 backdrop-blur-md gap-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {STEPS.map((step, idx) => {
          const isCompleted = completedStages.includes(step.id);
          const isCurrent = currentStage === step.id;
          const _isNext = !isCompleted && !isCurrent;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => onSelectStage?.(step.id)}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isCurrent
                    ? 'bg-brand-pink/10 border-brand-pink/50 shadow-xs dark:bg-brand-cyan/10 dark:border-brand-cyan/50 dark:shadow-sm dark:shadow-brand-cyan/20'
                    : isCompleted
                      ? 'bg-muted/40 border-border hover:bg-muted/70'
                      : 'bg-card/40 border-border/60 opacity-60 hover:opacity-90'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    isCompleted
                      ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40'
                      : isCurrent
                        ? 'bg-brand-pink text-brand-light font-bold ring-2 ring-brand-pink/40 dark:bg-brand-cyan dark:text-brand-dark dark:ring-brand-cyan/40'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCurrent
                          ? 'text-brand-pink dark:text-brand-cyan'
                          : isCompleted
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{step.shortDesc}</p>
                </div>
              </div>

              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block w-4 h-px bg-border shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};
