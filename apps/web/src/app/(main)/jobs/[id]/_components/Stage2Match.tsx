'use client';

import type { MatchAnalysis, StructuredJd } from '@praman/schemas';
import { Code2, FileText, Layers } from 'lucide-react';
import { JsonCard } from '@/components/JsonCard';
import { MatchScoreBadge } from '@/components/MatchScoreBadge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useCandidateProfile } from '@/hooks/usePramanApi';
import { useUrlTab } from '@/hooks/useUrlParams';
import { MatchDiffInspector } from './MatchDiffInspector';
import { StageEmpty } from './StageEmpty';
import { StageHeader } from './StageHeader';

interface Stage2MatchProps {
  analysis: MatchAnalysis | null | undefined;
  structured?: StructuredJd;
  isRunning: boolean;
  isDisabled: boolean;
  onRun: () => void;
}

export function Stage2Match({
  analysis,
  structured,
  isRunning,
  isDisabled,
  onRun,
}: Stage2MatchProps) {
  const { data: candidateProfile } = useCandidateProfile();
  const [activeView, setActiveView] = useUrlTab<'diff' | 'overview' | 'json'>({
    paramName: 'matchView',
    defaultValue: 'diff',
    validValues: ['diff', 'overview', 'json'],
  });

  return (
    <div className="space-y-5">
      <StageHeader
        title="Stage 2: Candidate ↔ JD Match Analysis"
        subtitle="Candidate capabilities compared against job description requirements."
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
          isRunning={isRunning}
          loadingMessage="Analyzing candidate profile against job description..."
        />
      ) : (
        <div className="space-y-5">
          {/* Top Radial Score Gauge & Breakdown Metrics */}
          <MatchScoreBadge analysis={analysis} variant="gauge" />

          {/* Sub-view switcher */}
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('diff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'diff'
                    ? 'bg-background text-brand-cyan shadow-xs border border-brand-cyan/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Alignment Diff Inspector</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'overview'
                    ? 'bg-background text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Synthesis & Skill Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'json'
                    ? 'bg-background text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Raw Match JSON</span>
              </button>
            </div>

            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
              Audit Mode: Multi-Source Diff
            </span>
          </div>

          {/* View Content */}
          {activeView === 'diff' && (
            <MatchDiffInspector
              analysis={analysis}
              structured={structured}
              candidateProfile={candidateProfile}
              onRunStage={onRun}
              isRunning={isRunning}
            />
          )}

          {activeView === 'overview' && (
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
            </div>
          )}

          {activeView === 'json' && (
            <JsonCard
              title="Match Analysis JSON"
              subtitle="Schema: MatchAnalysisSchema"
              data={analysis}
            />
          )}
        </div>
      )}
    </div>
  );
}
