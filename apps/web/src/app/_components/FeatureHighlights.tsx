'use client';

import { CheckCircle2, Code2, FileCheck2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Zero-Hallucination Engine',
    desc: 'Never fabricates companies, roles, or skills. Every claim is strictly grounded in candidate-confirmed facts.',
    badge: 'Fact-Grounded',
    color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30',
  },
  {
    icon: FileCheck2,
    title: '2-Layer Evidence Validator',
    desc: 'Automated post-generation audit validates that every resume accomplishment references verified source experience records.',
    badge: 'Audited Output',
    color: 'text-brand-pink bg-brand-pink/10 border-brand-pink/30',
  },
  {
    icon: Code2,
    title: 'ATS-Optimized LaTeX Code',
    desc: 'Compiles clean, human-readable Modern Developer LaTeX templates tailored for technical recruiters and parsing systems.',
    badge: 'ATS Compliant',
    color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30',
  },
];

export function FeatureHighlights() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card
            key={feature.title}
            className="p-6 border-border bg-card shadow-xs hover:border-border/80 transition-all space-y-4 gap-0"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${feature.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted/60 border border-border text-muted-foreground">
                {feature.badge}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{feature.desc}</p>
            </div>

            <div className="pt-3 border-t border-border flex items-center gap-1.5 text-xs text-brand-cyan">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-medium">Verified by automated pipeline audit</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
