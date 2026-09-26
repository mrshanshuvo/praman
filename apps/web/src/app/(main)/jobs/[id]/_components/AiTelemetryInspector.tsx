'use client';

import {
  Activity,
  Clock,
  Coins,
  Cpu,
  FileCheck,
  FileCode2,
  FileText,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useJobTelemetry } from '@/hooks/usePramanApi';

interface AiTelemetryInspectorProps {
  jobId: string;
  defaultTokens?: number | null;
  defaultCost?: number | null;
  defaultDuration?: number | null;
  defaultModel?: string | null;
}

const STAGE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  structuring: {
    label: 'Job Structuring',
    icon: FileText,
    color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20',
  },
  match: {
    label: 'Match & Gap Analysis',
    icon: Activity,
    color: 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20',
  },
  strategy: {
    label: 'Targeting Strategy',
    icon: Sparkles,
    color: 'text-brand-pink bg-brand-pink/10 border-brand-pink/20',
  },
  resume: {
    label: 'Resume Generation',
    icon: FileCode2,
    color: 'text-success bg-success/10 border-success/20',
  },
  cover_letter: {
    label: 'Cover Letter Outreach',
    icon: FileCheck,
    color: 'text-info bg-info/10 border-info/20',
  },
  recruiter_email: {
    label: 'Recruiter Outreach',
    icon: Mail,
    color: 'text-status-neutral bg-status-neutral/10 border-status-neutral/20',
  },
};

export function AiTelemetryInspector({
  jobId,
  defaultTokens,
  defaultCost,
  defaultDuration,
  defaultModel,
}: AiTelemetryInspectorProps) {
  const [open, setOpen] = useState(false);
  const { data: telemetry, isLoading } = useJobTelemetry(jobId);

  const totalTokens = telemetry?.totalTokens ?? defaultTokens ?? 0;
  const promptTokens = telemetry?.promptTokens ?? 0;
  const completionTokens = telemetry?.completionTokens ?? 0;
  const totalCostUsd = telemetry?.totalCostUsd ?? defaultCost ?? 0;
  const totalDurationMs = telemetry?.totalDurationMs ?? defaultDuration ?? 0;
  const stages = telemetry?.stages ?? [];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="group text-xs font-mono gap-1.5 px-2.5 py-1 h-8 rounded-lg border-border bg-card/60 hover:bg-card hover:border-brand-cyan/40 transition-all cursor-pointer"
        title="Inspect AI Token, Latency & Cost Telemetry"
      >
        <Zap className="w-3.5 h-3.5 text-brand-yellow group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-foreground">
          {totalTokens > 0 ? totalTokens.toLocaleString() : '0'}
        </span>
        <span className="text-muted-foreground">tkns</span>
        <span className="text-border">•</span>
        <span className="text-success font-medium">
          ${totalCostUsd > 0 ? totalCostUsd.toFixed(4) : '0.0000'}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border shadow-2xl p-6">
          <DialogHeader className="space-y-1.5 border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    AI Generation & Cost Telemetry
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Observability telemetry recorded for Job #{jobId.slice(0, 8)}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Aggregate KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-brand-yellow" />
                <span>Total Tokens</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-foreground">
                {totalTokens.toLocaleString()}
              </div>
              <div className="text-2xs text-muted-foreground font-mono">
                {promptTokens > 0 ? `${promptTokens.toLocaleString()} in` : ''}
                {promptTokens > 0 && completionTokens > 0 ? ' · ' : ''}
                {completionTokens > 0 ? `${completionTokens.toLocaleString()} out` : ''}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <Coins className="w-3.5 h-3.5 text-success" />
                <span>LLM Cost</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-success">
                ${totalCostUsd.toFixed(4)}
              </div>
              <div className="text-2xs text-muted-foreground font-mono">USD estimated</div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Total Latency</span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-foreground">
                {totalDurationMs >= 1000
                  ? `${(totalDurationMs / 1000).toFixed(2)}s`
                  : `${totalDurationMs}ms`}
              </div>
              <div className="text-2xs text-muted-foreground font-mono">model inference</div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <Cpu className="w-3.5 h-3.5 text-brand-pink" />
                <span>Cascade Engine</span>
              </div>
              <div
                className="text-xs sm:text-sm font-semibold text-foreground truncate"
                title={stages[0]?.model || defaultModel || 'Cascaded'}
              >
                {stages[0]?.model || defaultModel || 'gpt-4o-mini'}
              </div>
              <div className="text-2xs text-muted-foreground font-mono">Primary / Fallback</div>
            </div>
          </div>

          {/* Stage-by-Stage Breakdown */}
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground px-1">
              <span>Pipeline Stages Telemetry</span>
              <span className="text-2xs text-muted-foreground font-mono font-normal">
                {stages.length} recorded run{stages.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                  Loading telemetry logs...
                </div>
              ) : stages.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl bg-muted/20 border border-dashed border-border/60 text-muted-foreground space-y-1.5">
                  <Sparkles className="w-6 h-6 mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-medium text-foreground">
                    No generation logs recorded yet
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    Run pipeline stages to stream and record live inference token usage and costs.
                  </p>
                </div>
              ) : (
                stages.map((stage, idx) => {
                  const config = STAGE_CONFIG[stage.stage] || {
                    label: stage.stage,
                    icon: Sparkles,
                    color: 'text-muted-foreground bg-muted border-border',
                  };
                  const Icon = config.icon;

                  return (
                    <div
                      key={`${stage.stage}-${idx}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border shrink-0 ${config.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span>{config.label}</span>
                            <Badge
                              variant="outline"
                              className="text-2xs font-mono px-1.5 py-0 h-4 border-border text-muted-foreground"
                            >
                              {stage.model}
                            </Badge>
                          </div>
                          <div className="text-2xs text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                            <span>
                              {stage.promptTokens.toLocaleString()} in ·{' '}
                              {stage.completionTokens.toLocaleString()} out
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-center text-right font-mono">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-foreground">
                            {stage.totalTokens.toLocaleString()}{' '}
                            <span className="text-2xs text-muted-foreground font-normal">
                              tokens
                            </span>
                          </div>
                          <div className="text-2xs text-muted-foreground">
                            {stage.durationMs >= 1000
                              ? `${(stage.durationMs / 1000).toFixed(2)}s`
                              : `${stage.durationMs}ms`}
                          </div>
                        </div>

                        <div className="text-right min-w-15">
                          <div className="text-xs font-bold text-success">
                            ${stage.costUsd.toFixed(4)}
                          </div>
                          <div className="text-2xs text-muted-foreground">USD</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
