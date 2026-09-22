'use client';

import type { ResumeStatus, ValidationReport } from '@praman/schemas';
import { cn } from 'cn';
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
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useUrlTab } from '@/hooks/useUrlParams';

export interface EvidenceTarget {
  type: 'skill' | 'source' | 'bullet';
  key: string;
  sourceId?: string;
  timestamp?: number;
}

interface ValidationReportPanelProps {
  report: ValidationReport | null | undefined;
  status?: ResumeStatus;
  activeTarget?: EvidenceTarget | null;
  onSelectTarget?: (target: EvidenceTarget | null) => void;
}

const VALID_AUDIT_TABS = ['skills', 'sources', 'all'] as const;

export const ValidationReportPanel: React.FC<ValidationReportPanelProps> = ({
  report,
  status = report?.status ?? 'DRAFT',
  activeTarget,
  onSelectTarget,
}) => {
  const [activeSubTab, setActiveSubTab] = useUrlTab<'skills' | 'sources' | 'all'>({
    paramName: 'auditTab',
    defaultValue: 'skills',
    validValues: VALID_AUDIT_TABS,
  });

  // Auto-switch subtabs and scroll into view when an activeTarget is selected from resume
  useEffect(() => {
    if (!activeTarget) return;

    if (activeTarget.type === 'skill') {
      if (activeSubTab !== 'all') setActiveSubTab('skills');
      const targetId = `audit-skill-${activeTarget.key.toLowerCase().trim()}`;
      setTimeout(() => {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    } else if (activeTarget.type === 'source') {
      if (activeSubTab !== 'all') setActiveSubTab('sources');
      const targetId = `audit-source-${activeTarget.key.trim()}`;
      setTimeout(() => {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    } else if (activeTarget.type === 'bullet') {
      // Find matching numeric flag if exists
      if (report?.numberFlags?.length) {
        const flagIdx = report.numberFlags.findIndex(
          (f) =>
            f.bullet.trim() === activeTarget.key.trim() ||
            f.bullet.includes(activeTarget.key) ||
            activeTarget.key.includes(f.bullet),
        );
        if (flagIdx !== -1) {
          setTimeout(() => {
            const el = document.getElementById(`audit-bullet-${flagIdx}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 60);
          return;
        }
      }
      // If no numeric flag, jump to the parent source record
      if (activeTarget.sourceId) {
        if (activeSubTab !== 'all') setActiveSubTab('sources');
        const targetId = `audit-source-${activeTarget.sourceId.trim()}`;
        setTimeout(() => {
          const el = document.getElementById(targetId);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 60);
      }
    }
  }, [activeTarget]);

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
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
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
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
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
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
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
              {report.skillChecks?.map((chk, i) => {
                const isSelected =
                  activeTarget?.type === 'skill' &&
                  activeTarget.key.toLowerCase().trim() === chk.skill.toLowerCase().trim();

                return (
                  <div
                    key={i}
                    id={`audit-skill-${chk.skill.toLowerCase().trim()}`}
                    onDoubleClick={() =>
                      onSelectTarget?.({
                        type: 'skill',
                        key: chk.skill,
                        timestamp: Date.now(),
                      })
                    }
                    title="Double-click to locate skill in resume (Overleaf style)"
                    className={cn(
                      'flex items-center justify-between gap-2 text-xs p-2.5 rounded-lg border transition-all min-w-0 overflow-hidden cursor-pointer select-text',
                      isSelected
                        ? 'bg-brand-cyan/15 border-brand-cyan/60 ring-2 ring-brand-cyan/50 shadow-sm'
                        : 'bg-muted/40 border-border/70 hover:bg-muted/60 hover:border-border',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <span
                        className="font-medium text-foreground text-xs truncate"
                        title={chk.skill}
                      >
                        {chk.skill}
                      </span>
                      {chk.candidateLevel && (
                        <span className="text-2xs font-mono text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase">
                          {chk.candidateLevel}
                        </span>
                      )}
                    </div>
                    {chk.isAllowed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-pink bg-brand-pink/10 border border-brand-pink/20 px-2 py-0.5 rounded-full shrink-0">
                        <XCircle className="w-3 h-3" /> {chk.violation || 'Rejected'}
                      </span>
                    )}
                  </div>
                );
              })}
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
              {report.sourceIdChecks?.map((chk, i) => {
                const isSelected =
                  (activeTarget?.type === 'source' &&
                    (activeTarget.key.trim() === chk.sourceId.trim() ||
                      activeTarget.sourceId?.trim() === chk.sourceId.trim())) ||
                  (activeTarget?.type === 'bullet' &&
                    activeTarget.sourceId?.trim() === chk.sourceId.trim());

                return (
                  <div
                    key={i}
                    id={`audit-source-${chk.sourceId.trim()}`}
                    onDoubleClick={() =>
                      onSelectTarget?.({
                        type: 'source',
                        key: chk.sourceId,
                        timestamp: Date.now(),
                      })
                    }
                    title="Double-click to locate source record in resume (Overleaf style)"
                    className={cn(
                      'flex items-center justify-between gap-2 text-xs p-2.5 rounded-lg border transition-all min-w-0 overflow-hidden cursor-pointer select-text',
                      isSelected
                        ? 'bg-brand-cyan/15 border-brand-cyan/60 ring-2 ring-brand-cyan/50 shadow-sm'
                        : 'bg-muted/40 border-border/70 hover:bg-muted/60 hover:border-border',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <span className="font-semibold text-foreground uppercase tracking-wider text-2xs px-1.5 py-0.5 rounded bg-muted border border-border shrink-0">
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
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Found
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-pink bg-brand-pink/10 border border-brand-pink/20 px-2 py-0.5 rounded-full shrink-0">
                        <XCircle className="w-3 h-3" /> Missing
                      </span>
                    )}
                  </div>
                );
              })}
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
            {report.numberFlags.map((flag, idx) => {
              const isSelected =
                activeTarget?.type === 'bullet' &&
                (activeTarget.key.trim() === flag.bullet.trim() ||
                  flag.bullet.includes(activeTarget.key) ||
                  activeTarget.key.includes(flag.bullet));

              return (
                <div
                  key={idx}
                  id={`audit-bullet-${idx}`}
                  onDoubleClick={() =>
                    onSelectTarget?.({
                      type: 'bullet',
                      key: flag.bullet,
                      timestamp: Date.now(),
                    })
                  }
                  title="Double-click to locate flagged bullet in resume (Overleaf style)"
                  className={cn(
                    'p-2.5 rounded-lg border text-xs transition-all cursor-pointer select-text',
                    isSelected
                      ? 'bg-warning/10 border-warning/40 ring-2 ring-warning/40 shadow-sm'
                      : 'bg-card border-brand-pink/20 hover:border-brand-pink/40 hover:bg-card/80',
                  )}
                >
                  <div className="flex items-center gap-2 font-mono text-brand-pink text-xs mb-1">
                    <span>{flag.location}</span>
                    <span>• Numbers: {flag.flaggedNumbers.join(', ')}</span>
                  </div>
                  <p className="text-foreground font-mono text-xs">{flag.bullet}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
