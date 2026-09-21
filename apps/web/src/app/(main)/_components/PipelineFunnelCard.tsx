'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import { ArrowRight, ChevronRight, Layers, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Card } from '@/components/ui/card';

interface PipelineFunnelCardProps {
  jobs: JobDescriptionRecord[];
}

export const PipelineFunnelCard: React.FC<PipelineFunnelCardProps> = ({ jobs }) => {
  const total = jobs.length;
  const saved = jobs.filter((j) => j.status === 'SAVED').length;
  const applied = jobs.filter((j) => j.status === 'APPLIED').length;
  const interviewing = jobs.filter((j) => j.status === 'INTERVIEWING').length;
  const offer = jobs.filter((j) => j.status === 'OFFER').length;
  const rejected = jobs.filter((j) => j.status === 'REJECTED').length;

  // Active in funnel (Applied + Interviewing + Offer)
  const activePipeline = applied + interviewing + offer;

  // Conversion rates
  const appliedRate = total > 0 ? Math.round((activePipeline / total) * 100) : 0;
  const interviewRate =
    applied + interviewing + offer > 0
      ? Math.round(((interviewing + offer) / (applied + interviewing + offer)) * 100)
      : 0;
  const offerRate =
    interviewing + offer > 0 ? Math.round((offer / (interviewing + offer)) * 100) : 0;

  const funnelStages = [
    {
      label: 'Saved',
      count: saved,
      color: 'bg-muted-foreground/30 text-muted-foreground',
      barColor: 'bg-muted-foreground/50',
    },
    {
      label: 'Applied',
      count: applied,
      color: 'bg-blue-500/20 text-blue-400',
      barColor: 'bg-blue-500',
    },
    {
      label: 'Interviewing',
      count: interviewing,
      color: 'bg-brand-cyan/20 text-brand-cyan',
      barColor: 'bg-brand-cyan',
    },
    {
      label: 'Offer',
      count: offer,
      color: 'bg-emerald-500/20 text-emerald-400',
      barColor: 'bg-emerald-500',
    },
  ];

  return (
    <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Pipeline Funnel Analytics</h3>
            <p className="text-xs text-muted-foreground">
              Conversion flow across {total} tracked position{total === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <Link
          href="/jobs"
          className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1 group"
        >
          <span>Kanban Board</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {total === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2">
          <Layers className="w-6 h-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            No job descriptions added yet. Paste a JD or import a job to view your conversion
            funnel.
          </p>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
          >
            <span>Add your first job</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <>
          {/* Funnel Stage Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {funnelStages.map((stage) => (
              <div
                key={stage.label}
                className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {stage.label}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${stage.color}`}
                  >
                    {stage.count}
                  </span>
                </div>
                {/* Visual mini bar */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full ${stage.barColor} transition-all duration-500 rounded-full`}
                    style={{
                      width: total > 0 ? `${Math.max(8, (stage.count / total) * 100)}%` : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Conversion Metrics Summary */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border text-center">
            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70">
              <span className="text-[11px] text-muted-foreground block">Application Rate</span>
              <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                {appliedRate}%
              </span>
              <span className="text-[10px] text-muted-foreground/80">Saved → Applied</span>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70">
              <span className="text-[11px] text-muted-foreground block">Interview Rate</span>
              <span className="text-base font-bold font-mono text-brand-cyan mt-0.5 block">
                {interviewRate}%
              </span>
              <span className="text-[10px] text-muted-foreground/80">Applied → Round</span>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70">
              <span className="text-[11px] text-muted-foreground block">Offer Conversion</span>
              <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                {offerRate}%
              </span>
              <span className="text-[10px] text-muted-foreground/80">Rounds → Offer</span>
            </div>
          </div>

          {rejected > 0 && (
            <p className="text-[11px] text-muted-foreground text-center">
              Archived / Rejected: <span className="font-mono font-semibold">{rejected}</span>{' '}
              position
              {rejected === 1 ? '' : 's'}
            </p>
          )}
        </>
      )}
    </Card>
  );
};
