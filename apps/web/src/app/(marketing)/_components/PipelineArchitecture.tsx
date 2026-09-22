'use client';

import { Card } from '@/components/ui/card';

const PIPELINE_STAGES = [
  {
    num: '1',
    color: 'cyan',
    title: 'JD Analyzer',
    desc: 'Raw text → StructuredJd with required vs preferred skills, years of experience, and responsibilities.',
  },
  {
    num: '2',
    color: 'pink',
    title: 'Candidate Matcher',
    desc: 'Candidate profile ↔ StructuredJd audit. Explicitly populates doNotClaim and forbidden skills. No vanity scores.',
  },
  {
    num: '3',
    color: 'cyan',
    title: 'Resume Strategy',
    desc: 'Selects emphasized experience and project IDs, prioritized skills, and narrative framing guidance.',
  },
  {
    num: '4',
    color: 'pink',
    title: 'Resume & Audit',
    desc: 'Generates Resume JSON + runs 2-layer deterministic evidence cross-check with automatic retry on rejection.',
  },
] as const;

const colorMap: Record<string, string> = {
  cyan: 'bg-brand-cyan/15 border-brand-cyan/40 text-brand-cyan',
  pink: 'bg-brand-pink/15 border-brand-pink/40 text-brand-pink',
};

export function PipelineArchitecture() {
  return (
    <Card className="rounded-3xl border-border bg-card p-8 shadow-xs space-y-6 gap-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          End-to-End Pipeline Architecture
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Stateless prompts ensure subsequent stages only receive structured, validated JSON
          context.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_STAGES.map((stage) => (
          <Card key={stage.num} className="p-5 border-border bg-muted/40 space-y-2.5 gap-0">
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-sm ${colorMap[stage.color]}`}
            >
              {stage.num}
            </div>
            <h4 className="text-base font-semibold text-foreground">{stage.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{stage.desc}</p>
          </Card>
        ))}
      </div>
    </Card>
  );
}
