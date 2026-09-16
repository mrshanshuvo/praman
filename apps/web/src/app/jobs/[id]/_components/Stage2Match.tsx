'use client';

import { JsonCard } from '@/components/JsonCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StageEmpty } from './StageEmpty';
import { StageHeader } from './StageHeader';

interface Stage2MatchProps {
  analysis: any;
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
}

export function Stage2Match({ analysis, isRunning, isDisabled, onRun }: Stage2MatchProps) {
  return (
    <div className="space-y-4">
      <StageHeader
        title="Stage 2: Candidate ↔ JD Match Analysis"
        subtitle="Honest audit of confirmed candidate capabilities vs JD prerequisites."
        runLabel="Run Stage 2"
        rerunLabel="Re-run Match"
        hasResult={!!analysis}
        isRunning={isRunning}
        isDisabled={isDisabled}
        onRun={onRun}
      />

      {!analysis ? (
        <StageEmpty
          message="Match analysis has not been executed yet for this job description."
          ctaLabel="Run Candidate Matcher Now"
          onCta={onRun}
        />
      ) : (
        <div className="space-y-4">
          <Card className="p-4 border-border bg-card/60 gap-1.5">
            <h4 className="text-xs font-semibold text-foreground">Explainable Synthesis</h4>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              {analysis.explanation}
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-brand-cyan/30 bg-brand-cyan/10 gap-2">
              <h4 className="text-xs font-semibold text-brand-cyan mb-1">
                Strong Verified Matches ({analysis.strongMatches?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.strongMatches?.map((s: string, i: number) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs font-mono px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-brand-pink/30 bg-brand-pink/10 gap-2">
              <h4 className="text-xs font-semibold text-brand-pink mb-1">
                Do Not Claim / Gaps ({analysis.doNotClaim?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.doNotClaim?.map((s: string, i: number) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs font-mono px-2 py-0.5 rounded bg-brand-pink/20 text-brand-pink border-brand-pink/30"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          <JsonCard
            title="Match Analysis JSON"
            subtitle="Schema: MatchAnalysisSchema"
            data={analysis}
          />
        </div>
      )}
    </div>
  );
}
