'use client';

import type { ResumeStrategy } from '@praman/schemas';
import { JsonCard } from '@/components/JsonCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StageEmpty } from './StageEmpty';
import { StageHeader } from './StageHeader';

interface Stage3StrategyProps {
  strategy: ResumeStrategy | null | undefined;
  hasAnalysis: boolean;
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
}

export function Stage3Strategy({
  strategy,
  hasAnalysis,
  isRunning,
  isDisabled,
  onRun,
}: Stage3StrategyProps) {
  return (
    <div className="space-y-4">
      <StageHeader
        title="Stage 3: Resume Strategy"
        subtitle="Strategic prioritization and narrative angle formulation."
        runLabel="Run Stage 3"
        rerunLabel="Re-run Strategy"
        hasResult={!!strategy}
        isRunning={isRunning}
        isDisabled={isDisabled || !hasAnalysis}
        onRun={onRun}
      />

      {!strategy ? (
        <StageEmpty
          message={
            !hasAnalysis
              ? 'Please run Stage 2 (Candidate Match) before generating strategy.'
              : 'Resume strategy has not been formulated yet.'
          }
          ctaLabel={hasAnalysis ? 'Formulate Strategy Now' : undefined}
          onCta={hasAnalysis ? onRun : undefined}
        />
      ) : (
        <div className="space-y-4">
          <Card className="p-4 border-border bg-card/60 gap-1.5">
            <h4 className="text-xs font-semibold text-foreground">Narrative Guidance</h4>
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">
              {strategy.narrativeGuidance}
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-border bg-card/60 gap-2">
              <h4 className="text-xs font-semibold text-brand-cyan mb-1">Prioritized Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {strategy.prioritizedSkills?.map((s: string, i: number) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs font-mono px-2 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-brand-pink/30 bg-brand-pink/10 gap-2">
              <h4 className="text-xs font-semibold text-brand-pink mb-1">Forbidden Claims</h4>
              <div className="flex flex-wrap gap-1.5">
                {strategy.forbiddenClaims?.map((s: string, i: number) => (
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
            title="Resume Strategy JSON"
            subtitle="Schema: ResumeStrategySchema"
            data={strategy}
          />
        </div>
      )}
    </div>
  );
}
