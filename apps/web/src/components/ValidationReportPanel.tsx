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

      {/* Grid of Audits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source ID Traceability Check */}
        <Card className="border-border bg-card/70 p-4 gap-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-cyan" />
              <h4 className="text-sm font-semibold text-foreground">Source ID Traceability</h4>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground border-border"
            >
              {report.sourceIdChecks?.filter((c) => c.exists).length || 0} /{' '}
              {report.sourceIdChecks?.length || 0}
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {report.sourceIdChecks?.map((chk, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 border border-border"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-xs mr-1.5 px-1.5 py-0.5 rounded bg-muted">
                    {chk.field}
                  </span>
                  <span className="font-mono text-muted-foreground text-xs truncate">
                    {chk.sourceId}
                  </span>
                </div>
                {chk.exists ? (
                  <span className="flex items-center gap-1 text-xs text-brand-cyan shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Found
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-brand-pink shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> Missing
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Skill Verification Check */}
        <Card className="border-border bg-card/70 p-4 gap-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-cyan" />
              <h4 className="text-sm font-semibold text-foreground">
                Skill Level & Existence Check
              </h4>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-mono text-muted-foreground border-border"
            >
              {report.skillChecks?.filter((s) => s.isAllowed).length || 0} /{' '}
              {report.skillChecks?.length || 0}
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {report.skillChecks?.map((chk, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 border border-border"
              >
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{chk.skill}</span>
                  {chk.candidateLevel && (
                    <span className="text-xs font-mono text-muted-foreground ml-2">
                      ({chk.candidateLevel})
                    </span>
                  )}
                </div>
                {chk.isAllowed ? (
                  <span className="flex items-center gap-1 text-xs text-brand-cyan shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-brand-pink shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> {chk.violation || 'Rejected'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
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
