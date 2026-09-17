'use client';

import type { ResumeStatus, ValidationReport } from '@praman/schemas';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Hash,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ValidationReportPanelProps {
  report: ValidationReport | null | undefined;
  status?: ResumeStatus;
}

export const ValidationReportPanel: React.FC<ValidationReportPanelProps> = ({
  report,
  status = report?.status ?? 'DRAFT',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'sources' | 'all'>('skills');
  if (!report) {
    return (
      <Card className="border-border bg-card p-5 text-center text-muted-foreground">
        <p className="text-sm">No validation report available for this stage yet.</p>
      </Card>
    );
  }

  const isValidated = status === 'VALIDATED';
  const isRejected = status === 'REJECTED';

  return (
    <div className="space-y-4">
      {/* Top Banner Status */}
      <Card
        className={`p-4 border flex-row items-center justify-between gap-3 ${
          isValidated
            ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'
            : isRejected
              ? 'bg-brand-pink/10 border-brand-pink/30 text-brand-pink'
              : 'bg-muted border-border text-muted-foreground'
        }`}
      >
        <div className="flex items-center gap-3">
          {isValidated ? (
            <ShieldCheck className="w-6 h-6 text-brand-cyan" />
          ) : isRejected ? (
            <ShieldAlert className="w-6 h-6 text-brand-pink" />
          ) : (
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-semibold text-sm sm:text-base">
              {isValidated
                ? 'Truth-Preserved & Fully Validated'
                : isRejected
                  ? 'Validation Rejected — Evidence Discrepancies Found'
                  : 'Draft Stage — Pending Validation Checks'}
            </h3>
            <p className="text-xs opacity-90">
              {isValidated
                ? 'Every claim, bullet, and skill strictly cross-referenced against confirmed candidate records.'
                : isRejected
                  ? `${report.violations.length} violation(s) flagged against the source profile data.`
                  : 'Awaiting deterministic 2-layer verification audit execution.'}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
            isValidated
              ? 'bg-brand-cyan/20 border-brand-cyan/40 text-brand-cyan'
              : isRejected
                ? 'bg-brand-pink/20 border-brand-pink/40 text-brand-pink'
                : 'bg-muted border-border text-muted-foreground'
          }`}
        >
          {status}
        </Badge>
      </Card>

      {/* Violations List */}
      {report.violations && report.violations.length > 0 && (
        <Card className="border-brand-pink/40 bg-brand-pink/10 p-4 gap-2">
          <div className="flex items-center gap-2 text-brand-pink">
            <XCircle className="w-4 h-4 shrink-0" />
            <h4 className="text-sm font-semibold">
              Strict Rule Violations ({report.violations.length})
            </h4>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-brand-pink/90 font-mono">
            {report.violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Sub-audit Navigation / Tab Filter */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Detailed Checks
        </span>
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setActiveSubTab('skills')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeSubTab === 'skills'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Skills ({report.skillChecks?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('sources')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeSubTab === 'sources'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Source IDs ({report.sourceIdChecks?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              activeSubTab === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Audit Panels List */}
      <div className="space-y-4">
        {/* Skill Verification Check */}
        {(activeSubTab === 'skills' || activeSubTab === 'all') && (
          <Card className="border-border bg-card/70 p-4 gap-2 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-cyan shrink-0" />
                <h4 className="text-sm font-semibold text-foreground">
                  Skill Level & Existence Check
                </h4>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono text-muted-foreground border-border shrink-0"
              >
                {report.skillChecks?.filter((s) => s.isAllowed).length || 0} /{' '}
                {report.skillChecks?.length || 0}
              </Badge>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto overflow-x-hidden pr-1">
              {report.skillChecks?.map((chk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-lg bg-muted/40 border border-border/70 hover:bg-muted/60 transition-colors min-w-0 overflow-hidden"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span
                      className="font-medium text-foreground text-xs truncate"
                      title={chk.skill}
                    >
                      {chk.skill}
                    </span>
                    {chk.candidateLevel && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase">
                        {chk.candidateLevel}
                      </span>
                    )}
                  </div>
                  {chk.isAllowed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-pink bg-brand-pink/10 border border-brand-pink/20 px-2 py-0.5 rounded-full shrink-0">
                      <XCircle className="w-3 h-3" /> {chk.violation || 'Rejected'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Source ID Traceability Check */}
        {(activeSubTab === 'sources' || activeSubTab === 'all') && (
          <Card className="border-border bg-card/70 p-4 gap-2 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-cyan shrink-0" />
                <h4 className="text-sm font-semibold text-foreground">Source ID Traceability</h4>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono text-muted-foreground border-border shrink-0"
              >
                {report.sourceIdChecks?.filter((c) => c.exists).length || 0} /{' '}
                {report.sourceIdChecks?.length || 0}
              </Badge>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto overflow-x-hidden pr-1">
              {report.sourceIdChecks?.map((chk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-lg bg-muted/40 border border-border/70 hover:bg-muted/60 transition-colors min-w-0 overflow-hidden"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span className="font-semibold text-foreground uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border shrink-0">
                      {chk.field}
                    </span>
                    <span
                      className="font-mono text-muted-foreground text-xs truncate block"
                      title={chk.sourceId}
                    >
                      {chk.sourceId.length > 20
                        ? `${chk.sourceId.slice(0, 8)}...${chk.sourceId.slice(-6)}`
                        : chk.sourceId}
                    </span>
                  </div>
                  {chk.exists ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Found
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-pink bg-brand-pink/10 border border-brand-pink/20 px-2 py-0.5 rounded-full shrink-0">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Numeric Checks (§8: Numbers are flagged for review) */}
      {report.numberFlags && report.numberFlags.length > 0 && (
        <Card className="border-brand-pink/30 bg-brand-pink/10 p-4 gap-2">
          <div className="flex items-center gap-2 mb-1 text-brand-pink">
            <Hash className="w-4 h-4" />
            <h4 className="text-sm font-semibold">
              Numeric Claims Inspection ({report.numberFlags.length})
            </h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Numbers in generated resume bullets were detected that were not identical in raw source
            bullet text. Flagged for review to ensure metrics were not exaggerated or hallucinated.
          </p>
          <div className="space-y-2">
            {report.numberFlags.map((flag, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-card border border-brand-pink/20 text-xs"
              >
                <div className="flex items-center gap-2 font-mono text-brand-pink text-xs mb-1">
                  <span>{flag.location}</span>
                  <span>• Numbers: {flag.flaggedNumbers.join(', ')}</span>
                </div>
                <p className="text-foreground font-mono text-xs">{flag.bullet}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
