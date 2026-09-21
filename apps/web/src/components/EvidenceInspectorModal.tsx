'use client';

import {
  AlertTriangle,
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Hash,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type EvidenceType = 'experience' | 'project' | 'skill' | 'bullet' | 'education';
export type EvidenceStatus = 'VERIFIED' | 'FLAGGED' | 'UNVERIFIED';

export interface InspectedEvidence {
  type: EvidenceType;
  claim: string;
  sourceId?: string;
  sourceTitle?: string;
  validationStatus: EvidenceStatus;
  flagReason?: string;
  flaggedNumbers?: string[];
  candidateRecord?: any;
}

interface EvidenceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: InspectedEvidence | null;
}

export const EvidenceInspectorModal: React.FC<EvidenceInspectorModalProps> = ({
  isOpen,
  onClose,
  evidence,
}) => {
  if (!evidence) return null;

  const isVerified = evidence.validationStatus === 'VERIFIED';
  const isFlagged = evidence.validationStatus === 'FLAGGED';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-6 gap-5">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isVerified
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isFlagged
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {evidence.type === 'experience' || evidence.type === 'bullet' ? (
                  <Briefcase className="w-5 h-5" />
                ) : evidence.type === 'project' ? (
                  <FolderGit2 className="w-5 h-5" />
                ) : evidence.type === 'skill' ? (
                  <Award className="w-5 h-5" />
                ) : (
                  <GraduationCap className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Evidence & Ground-Truth Inspector
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Trace AI-generated claims against your verified candidate records.
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-xs font-mono font-bold px-2.5 py-0.5 uppercase shrink-0 ${
                isVerified
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : isFlagged
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {evidence.validationStatus}
            </Badge>
          </div>
        </DialogHeader>

        {/* Verification Alert Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
            isVerified
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : isFlagged
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {isVerified ? (
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : isFlagged ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          )}

          <div className="space-y-1">
            <p className="font-semibold">
              {isVerified
                ? 'Grounded Claim Verified'
                : isFlagged
                  ? 'Metric Review Flagged'
                  : 'Missing Ground-Truth Record'}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {isVerified
                ? 'This claim is verified against your candidate profile records.'
                : isFlagged
                  ? evidence.flagReason ||
                    'Numbers or metrics in this claim differ from raw candidate profile text. Inspect raw source below.'
                  : 'No matching candidate record was found for this claimed ID or skill.'}
            </p>
          </div>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Panel A: Generated Claim */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Generated Resume Claim
              </span>
              {evidence.sourceTitle && (
                <span className="text-[11px] font-mono text-muted-foreground truncate max-w-37.5">
                  {evidence.sourceTitle}
                </span>
              )}
            </div>

            <div className="p-3 rounded-lg bg-background/80 border border-border/80 text-xs text-foreground font-medium leading-relaxed">
              {evidence.claim}
            </div>

            {evidence.flaggedNumbers && evidence.flaggedNumbers.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span>Flagged Metrics: {evidence.flaggedNumbers.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Panel B: Candidate Profile Evidence */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-pink dark:text-brand-cyan">
                Ground-Truth Profile Evidence
              </span>
              {evidence.sourceId && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  ID: {evidence.sourceId.slice(0, 8)}...
                </span>
              )}
            </div>

            {evidence.candidateRecord ? (
              <div className="p-3 rounded-lg bg-background/80 border border-border/80 text-xs space-y-2 max-h-52 overflow-y-auto">
                {evidence.candidateRecord.company && (
                  <div>
                    <span className="font-semibold text-foreground">
                      {evidence.candidateRecord.title}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}
                      at {evidence.candidateRecord.company}
                    </span>
                  </div>
                )}

                {evidence.candidateRecord.name && !evidence.candidateRecord.company && (
                  <div className="font-semibold text-foreground">
                    {evidence.candidateRecord.name}
                  </div>
                )}

                {evidence.candidateRecord.level && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Proficiency Level:</span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {evidence.candidateRecord.level}
                    </Badge>
                  </div>
                )}

                {evidence.candidateRecord.evidence && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Skill Evidence:
                    </span>
                    <p className="text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/60">
                      {evidence.candidateRecord.evidence}
                    </p>
                  </div>
                )}

                {/* Raw Achievements or Responsibilities */}
                {evidence.candidateRecord.achievements?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Raw Achievements:
                    </span>
                    <ul className="pl-4 list-disc space-y-1 text-muted-foreground">
                      {evidence.candidateRecord.achievements.map((ach: string, i: number) => (
                        <li key={i}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evidence.candidateRecord.responsibilities?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Raw Responsibilities:
                    </span>
                    <ul className="pl-4 list-disc space-y-1 text-muted-foreground">
                      {evidence.candidateRecord.responsibilities.map((resp: string, i: number) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evidence.candidateRecord.outcomes?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Project Outcomes:
                    </span>
                    <ul className="pl-4 list-disc space-y-1 text-muted-foreground">
                      {evidence.candidateRecord.outcomes.map((out: string, i: number) => (
                        <li key={i}>{out}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evidence.candidateRecord.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {evidence.candidateRecord.technologies.map((t: string, i: number) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-background/80 border border-border/80 text-xs text-muted-foreground italic text-center py-6">
                No matching ground-truth profile entry found.
              </div>
            )}
          </div>
        </div>

        <DialogFooter showCloseButton={false}>
          <DialogClose render={<Button variant="outline" size="sm" onClick={onClose} />}>
            Close Inspector
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
