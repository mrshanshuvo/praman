'use client';

import {
  type CalculatedMatchScore,
  calculateMatchScore,
  type MatchAlignmentTier,
  type MatchAnalysis,
} from '@praman/schemas';
import { AlertTriangle, Award, CheckCircle2, HelpCircle, Sparkles, Target } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface MatchScoreBadgeProps {
  analysis?: Partial<MatchAnalysis> | null;
  scoreData?: CalculatedMatchScore | null;
  variant?: 'compact' | 'pill' | 'gauge';
  className?: string;
  showBreakdown?: boolean;
}

function getTierStyles(tier: MatchAlignmentTier) {
  switch (tier) {
    case 'Exceptional':
      return {
        badge:
          'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40 dark:bg-brand-cyan/20 dark:text-brand-cyan dark:border-brand-cyan/50',
        stroke: 'stroke-brand-cyan',
        text: 'text-brand-cyan',
        bg: 'bg-brand-cyan/10',
        border: 'border-brand-cyan/30',
        ringColor: '#00e5ff',
      };
    case 'Strong':
      return {
        badge:
          'bg-emerald-500/15 text-emerald-600 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50',
        stroke: 'stroke-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        ringColor: '#10b981',
      };
    case 'Moderate':
      return {
        badge:
          'bg-amber-500/15 text-amber-600 border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/50',
        stroke: 'stroke-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        ringColor: '#f59e0b',
      };
    default:
      return {
        badge:
          'bg-brand-pink/15 text-brand-pink border-brand-pink/40 dark:bg-brand-pink/20 dark:text-brand-pink dark:border-brand-pink/50',
        stroke: 'stroke-brand-pink',
        text: 'text-brand-pink',
        bg: 'bg-brand-pink/10',
        border: 'border-brand-pink/30',
        ringColor: '#ff2a85',
      };
  }
}

export function MatchScoreBadge({
  analysis,
  scoreData,
  variant = 'compact',
  className = '',
  showBreakdown = true,
}: MatchScoreBadgeProps) {
  const data = React.useMemo(() => {
    if (scoreData) return scoreData;
    return calculateMatchScore(analysis);
  }, [scoreData, analysis]);

  const styles = getTierStyles(data.label);

  if (variant === 'gauge') {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (data.score / 100) * circumference;

    return (
      <Card
        className={`p-5 border-border bg-card/80 backdrop-blur-md transition-all duration-200 ${className}`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Radial Progress Ring */}
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-muted/40 fill-none"
                  strokeWidth="8"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className={`${styles.stroke} fill-none transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono tracking-tight text-foreground">
                  {data.score}%
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${styles.text}`}
                >
                  {data.label}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Deterministic Match Score
                </h3>
                <Badge
                  variant="outline"
                  className={`text-xs font-mono font-medium px-2 py-0.5 ${styles.badge}`}
                >
                  {data.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                Calculated by comparing verified candidate skills against required job prerequisites.
              </p>
            </div>
          </div>

          {/* Breakdown Pills */}
          {showBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
              <div className="p-2.5 rounded-lg border border-brand-cyan/30 bg-brand-cyan/5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-[11px] text-brand-cyan font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Strong</span>
                </div>
                <span className="text-base font-bold font-mono text-foreground mt-0.5">
                  {data.breakdown.strongMatchesCount}
                </span>
                <span className="text-[10px] text-muted-foreground">1.0x weight</span>
              </div>

              <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>Partial</span>
                </div>
                <span className="text-base font-bold font-mono text-foreground mt-0.5">
                  {data.breakdown.partialMatchesCount}
                </span>
                <span className="text-[10px] text-muted-foreground">0.5x weight</span>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  <HelpCircle className="w-3 h-3" />
                  <span>Missing</span>
                </div>
                <span className="text-base font-bold font-mono text-foreground mt-0.5">
                  {data.breakdown.missingSkillsCount}
                </span>
                <span className="text-[10px] text-muted-foreground">0.0x weight</span>
              </div>

              <div className="p-2.5 rounded-lg border border-brand-pink/30 bg-brand-pink/5 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-[11px] text-brand-pink font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Deductions</span>
                </div>
                <span className="text-base font-bold font-mono text-brand-pink mt-0.5">
                  -{data.breakdown.gapDeductions}
                </span>
                <span className="text-[10px] text-muted-foreground">Gap penalty</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Pill variant (ideal for headers)
  if (variant === 'pill') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-semibold transition-colors cursor-help ${styles.badge} ${className}`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{data.score}%</span>
              <span className="text-[10px] font-sans opacity-80">• {data.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs p-2.5 space-y-1 max-w-xs">
            <p className="font-semibold text-foreground">Score Breakdown</p>
            <div className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
              <div>Strong matches: {data.breakdown.strongMatchesCount}</div>
              <div>Partial matches: {data.breakdown.partialMatchesCount}</div>
              <div>Missing skills: {data.breakdown.missingSkillsCount}</div>
              <div>Gap deductions: -{data.breakdown.gapDeductions} pts</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant (ideal for JobCard)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-mono font-medium px-2 py-0.5 cursor-help transition-all duration-150 ${styles.badge} ${className}`}
          >
            <Award className="w-3 h-3 shrink-0" />
            <span className="font-bold">{data.score}%</span>
            <span className="font-sans text-[11px] opacity-90">{data.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs p-2.5 space-y-1.5 max-w-xs">
          <div className="font-semibold flex items-center justify-between gap-2 text-foreground">
            <span>Deterministic Match Score</span>
            <span className={styles.text}>{data.score}%</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug font-sans">
            Strictly computed from Stage 2 analysis: {data.breakdown.strongMatchesCount} verified,{' '}
            {data.breakdown.partialMatchesCount} partial, {data.breakdown.missingSkillsCount}{' '}
            missing skills.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
