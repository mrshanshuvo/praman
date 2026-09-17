'use client';

import { Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StageHeaderProps {
  title: string;
  subtitle: string;
  runLabel: string;
  rerunLabel: string;
  hasResult: boolean;
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
}

export function StageHeader({
  title,
  subtitle,
  runLabel,
  rerunLabel,
  hasResult,
  isRunning,
  isDisabled,
  onRun,
}: StageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <Button
        size="sm"
        onClick={onRun}
        disabled={isDisabled}
        className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20"
      >
        {isRunning ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-brand-dark" />
        )}
        <span>{hasResult ? rerunLabel : runLabel}</span>
      </Button>
    </div>
  );
}
