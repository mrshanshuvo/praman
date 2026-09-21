'use client';

import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Terminal, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { PipelineStreamLog } from '@/hooks/usePipelineStream';

interface PipelineLiveLogsProps {
  logs: PipelineStreamLog[];
  isStreaming: boolean;
}

export const PipelineLiveLogs: React.FC<PipelineLiveLogsProps> = ({ logs, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (logs.length === 0 && !isStreaming) return null;

  const latestLog = logs[logs.length - 1];

  return (
    <Card className="w-full bg-card/95 border-border rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Live Pipeline Execution Stream
              </h3>
              {isStreaming ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/30 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Streaming SSE
                </span>
              ) : logs.length > 0 ? (
                logs.some((l) => l.status === 'failed') ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/30">
                    <XCircle className="w-3 h-3" />
                    Failed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )
              ) : null}
            </div>
            {latestLog && !isExpanded && (
              <p className="text-xs text-muted-foreground truncate max-w-md sm:max-w-xl mt-0.5 font-mono">
                {latestLog.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={isExpanded ? 'Collapse logs' : 'Expand logs'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="rounded-xl bg-background/80 border border-border/80 p-3.5 font-mono text-xs max-h-56 overflow-y-auto space-y-2">
          {logs.map((log, index) => {
            const hasSubsequentCompletionOrAdvance = logs
              .slice(index + 1)
              .some(
                (l) =>
                  (l.stage === log.stage &&
                    (l.status === 'completed' ||
                      l.status === 'complete' ||
                      l.status === 'failed')) ||
                  (l.status === 'complete' && l.stage === 'pipeline') ||
                  l.status === 'started',
              );

            const isCompleted =
              log.status === 'completed' ||
              log.status === 'complete' ||
              (log.status === 'started' && (!isStreaming || hasSubsequentCompletionOrAdvance));
            const isFailed = log.status === 'failed';
            const isRunning =
              log.status === 'started' && isStreaming && !hasSubsequentCompletionOrAdvance;

            return (
              <div key={log.id} className="flex items-start gap-2.5">
                <span className="text-[11px] text-muted-foreground shrink-0 select-none">
                  {log.timestamp}
                </span>

                <span className="shrink-0 mt-0.5">
                  {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />}
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {isFailed && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                </span>

                <span
                  className={`font-semibold uppercase text-[10px] px-1.5 py-0.2 rounded shrink-0 ${
                    isRunning
                      ? 'bg-brand-cyan/20 text-brand-cyan'
                      : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-destructive/20 text-destructive'
                  }`}
                >
                  {log.stage}
                </span>

                <span
                  className={`flex-1 wrap-break-word ${
                    isFailed
                      ? 'text-destructive'
                      : isRunning
                        ? 'text-brand-pink dark:text-brand-cyan'
                        : 'text-foreground'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
