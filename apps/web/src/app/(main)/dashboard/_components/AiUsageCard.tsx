'use client';

import { Activity, Coins, Cpu, TrendingUp, Zap } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserAiUsage } from '@/hooks/usePramanApi';

export const AiUsageCard: React.FC = () => {
  const { data: usage, isLoading } = useUserAiUsage();

  if (isLoading) {
    return (
      <Card className="p-6 border-border bg-card/80 backdrop-blur-md space-y-4">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </Card>
    );
  }

  const totalTokens = usage?.totalTokens ?? 0;
  const quotaLimitTokens = usage?.quotaLimitTokens ?? 500_000;
  const quotaUsedPercentage = usage?.quotaUsedPercentage ?? 0;
  const totalCostUsd = usage?.totalCostUsd ?? 0;
  const totalGenerations = usage?.totalGenerations ?? 0;
  const stageBreakdown = usage?.stageBreakdown ?? {};

  const avgCostPerGen =
    totalGenerations > 0 ? (totalCostUsd / totalGenerations).toFixed(4) : '0.0000';

  const stagesList = [
    { key: 'structuring', label: 'Structuring', color: 'bg-brand-cyan' },
    { key: 'match', label: 'Matching', color: 'bg-brand-yellow' },
    { key: 'strategy', label: 'Strategy', color: 'bg-brand-pink' },
    { key: 'resume', label: 'Resume', color: 'bg-emerald-400' },
    { key: 'cover_letter', label: 'Outreach', color: 'bg-indigo-400' },
  ];

  return (
    <Card className="p-6 border-border bg-card/80 backdrop-blur-md flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                AI Generation & Cost Observability
              </h2>
              <p className="text-xs text-muted-foreground">
                Monthly LLM token quota & real-time cost telemetry
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-2xs font-mono px-2 py-0.5 rounded-full border-brand-cyan/30 text-brand-cyan bg-brand-cyan/10"
          >
            Cascade Active
          </Badge>
        </div>

        {/* Quota Progress Bar */}
        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/70">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-brand-yellow" />
              Token Quota Usage
            </span>
            <span className="font-mono text-foreground font-semibold">
              {totalTokens.toLocaleString()}{' '}
              <span className="text-muted-foreground font-normal">
                / {quotaLimitTokens.toLocaleString()} ({quotaUsedPercentage}%)
              </span>
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden border border-border/60">
            <div
              className="h-full bg-linear-to-r from-brand-cyan via-brand-yellow to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(2, Math.min(100, quotaUsedPercentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-2xs text-muted-foreground pt-0.5">
            <span>500k monthly quota limit</span>
            <span className="font-mono font-medium text-foreground">
              {(quotaLimitTokens - totalTokens).toLocaleString()} remaining
            </span>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-0.5">
            <div className="flex items-center gap-1 text-2xs text-muted-foreground">
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>Total Cost</span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-400">
              ${totalCostUsd.toFixed(4)}
            </div>
            <div className="text-3xs text-muted-foreground font-mono">USD tracked</div>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-0.5">
            <div className="flex items-center gap-1 text-2xs text-muted-foreground">
              <Activity className="w-3 h-3 text-brand-cyan" />
              <span>Generations</span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-foreground">
              {totalGenerations}
            </div>
            <div className="text-3xs text-muted-foreground font-mono">pipeline steps</div>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-0.5">
            <div className="flex items-center gap-1 text-2xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-brand-pink" />
              <span>Avg / Step</span>
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-foreground">
              ${avgCostPerGen}
            </div>
            <div className="text-3xs text-muted-foreground font-mono">efficiency</div>
          </div>
        </div>
      </div>

      {/* Stage Breakdown Pills */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-2xs text-muted-foreground font-medium">
          <span>Inference Breakdown by Stage</span>
          <span className="font-mono">{Object.keys(stageBreakdown).length} active stages</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stagesList.map(({ key, label, color }) => {
            const stageData = stageBreakdown[key];
            const count = stageData?.count ?? 0;
            const cost = stageData?.costUsd ?? 0;

            return (
              <div
                key={key}
                className="p-2 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                  <span className="text-2xs font-medium text-foreground truncate">{label}</span>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <div className="text-2xs font-semibold text-foreground">{count}x</div>
                  <div className="text-3xs text-muted-foreground">${cost.toFixed(3)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
