'use client';

import type { CandidateProfile, ResumeData, ValidationReport } from '@praman/schemas';
import { cn } from 'cn';
import {
  AlertTriangle,
  Award,
  Briefcase,
  CheckCircle2,
  FolderGit2,
  Hash,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { EvidenceTarget } from '@/components/ValidationReportPanel';
import { EvidenceInspectorModal, type InspectedEvidence } from './EvidenceInspectorModal';

interface ResumeViewerProps {
  resume: ResumeData;
  validationReport?: ValidationReport | null;
  candidateProfile?: CandidateProfile;
  activeTarget?: EvidenceTarget | null;
  onSelectTarget?: (target: EvidenceTarget | null) => void;
}

export function ResumeViewer({
  resume,
  validationReport,
  candidateProfile,
  activeTarget,
  onSelectTarget,
}: ResumeViewerProps) {
  const [inspectedEvidence, setInspectedEvidence] = useState<InspectedEvidence | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openInspector = (evidence: InspectedEvidence) => {
    setInspectedEvidence(evidence);
    setIsModalOpen(true);
  };

  const numberFlags = validationReport?.numberFlags || [];
  const skillChecks = validationReport?.skillChecks || [];

  // Auto-scroll to matching target when triggered from audit panel
  useEffect(() => {
    if (!activeTarget) return;

    let targetId = '';
    if (activeTarget.type === 'skill') {
      targetId = `resume-skill-${activeTarget.key.toLowerCase().trim()}`;
    } else if (activeTarget.type === 'source') {
      targetId = `resume-source-${activeTarget.key.trim()}`;
    } else if (activeTarget.type === 'bullet') {
      const match = document.querySelector(
        `[data-bullet-text="${encodeURIComponent(activeTarget.key.trim())}"]`,
      );
      if (match) {
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (activeTarget.sourceId) {
        targetId = `resume-source-${activeTarget.sourceId.trim()}`;
      }
    }

    if (targetId) {
      const el = document.getElementById(targetId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTarget]);

  return (
    <>
      <Card className="p-6 sm:p-8 border-border bg-card/80 backdrop-blur-md space-y-6 gap-0">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {resume.personal?.name}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
            {Object.entries(resume.personal?.contact || {}).map(([k, v]: [string, any]) => (
              <span key={k}>
                <span className="capitalize text-muted-foreground/80">{k}:</span> {v}
              </span>
            ))}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Summary */}
        {resume.summary && (
          <div>
            <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider mb-2">
              Professional Summary
            </h3>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {resume.summary}
            </p>
          </div>
        )}

        {/* Verified Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider">
                Technical Skills & Proficiency
              </h3>
              <span className="text-xs text-muted-foreground">
                Double-click to locate in audit panel • Click to inspect
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {resume.skills.map((sk: string, i: number) => {
                const check = skillChecks.find(
                  (c) => c.skill.toLowerCase() === sk.trim().toLowerCase(),
                );
                const candidateSkill = candidateProfile?.skills?.find(
                  (s: any) => s.name?.toLowerCase() === sk.trim().toLowerCase(),
                );
                const isAllowed = check ? check.isAllowed : true;
                const isSelected =
                  activeTarget?.type === 'skill' &&
                  activeTarget.key.toLowerCase().trim() === sk.toLowerCase().trim();

                return (
                  <button
                    type="button"
                    key={i}
                    id={`resume-skill-${sk.toLowerCase().trim()}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onSelectTarget?.({
                        type: 'skill',
                        key: sk,
                        timestamp: Date.now(),
                      });
                    }}
                    onClick={() =>
                      openInspector({
                        type: 'skill',
                        claim: sk,
                        validationStatus: isAllowed ? 'VERIFIED' : 'FLAGGED',
                        sourceTitle: check?.candidateLevel
                          ? `Level: ${check.candidateLevel}`
                          : undefined,
                        flagReason: check?.violation,
                        candidateRecord: candidateSkill,
                      })
                    }
                    title="Click to inspect ground truth • Double-click to jump to audit panel (Overleaf style)"
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer text-left',
                      isSelected
                        ? 'bg-brand-cyan/20 border-brand-cyan ring-2 ring-brand-cyan/50 shadow-md scale-105'
                        : 'bg-muted/60 border-border hover:border-brand-cyan/50 hover:bg-muted',
                    )}
                  >
                    <Award className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                    <span className="text-foreground">{sk}</span>
                    {check?.candidateLevel && (
                      <span className="text-2xs px-1 py-0.2 rounded bg-background/80 text-muted-foreground border border-border">
                        {check.candidateLevel}
                      </span>
                    )}
                    {isAllowed ? (
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider">
                Work Experience & Evidence Audits
              </h3>
              <span className="text-xs text-muted-foreground">
                Double-click any bullet or header to jump to audit evidence
              </span>
            </div>

            {resume.experience.map((exp: any, i: number) => {
              const matchedCandidateExp = candidateProfile?.experiences?.find(
                (ce: any) => ce.id === exp.sourceExperienceId,
              );
              const isSourceSelected =
                (activeTarget?.type === 'source' && activeTarget.key === exp.sourceExperienceId) ||
                (activeTarget?.type === 'bullet' &&
                  activeTarget.sourceId === exp.sourceExperienceId);

              return (
                <div
                  key={i}
                  id={`resume-source-${exp.sourceExperienceId}`}
                  className={cn(
                    'p-4 rounded-xl border transition-all space-y-2.5',
                    isSourceSelected
                      ? 'border-brand-cyan/70 bg-brand-cyan/5 ring-1 ring-brand-cyan/40 shadow-sm'
                      : 'border-border/80 bg-background/50',
                  )}
                >
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer select-text"
                    onDoubleClick={() =>
                      onSelectTarget?.({
                        type: 'source',
                        key: exp.sourceExperienceId,
                        timestamp: Date.now(),
                      })
                    }
                    title="Double-click to locate source record in audit panel (Overleaf style)"
                  >
                    <div>
                      <h4 className="text-base font-semibold text-foreground">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openInspector({
                          type: 'experience',
                          claim: `${exp.title} at ${exp.company}`,
                          sourceId: exp.sourceExperienceId,
                          sourceTitle: `${exp.title} (${exp.company})`,
                          validationStatus: matchedCandidateExp ? 'VERIFIED' : 'UNVERIFIED',
                          candidateRecord: matchedCandidateExp,
                        })
                      }
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Inspect source experience in candidate profile"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>{exp.sourceExperienceId?.slice(0, 8)}...</span>
                      <Search className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>

                  <ul className="space-y-2 text-sm text-foreground/90 leading-relaxed">
                    {exp.bullets?.map((b: string, bIdx: number) => {
                      const flagged = numberFlags.find((f) => f.bullet.trim() === b.trim());
                      const isBulletSelected =
                        activeTarget?.type === 'bullet' &&
                        (activeTarget.key.trim() === b.trim() ||
                          b.includes(activeTarget.key) ||
                          activeTarget.key.includes(b));

                      return (
                        <li
                          key={bIdx}
                          data-bullet-text={encodeURIComponent(b.trim())}
                          onDoubleClick={() =>
                            onSelectTarget?.({
                              type: 'bullet',
                              key: b,
                              sourceId: exp.sourceExperienceId,
                              timestamp: Date.now(),
                            })
                          }
                          title="Double-click to jump to audit evidence (Overleaf style)"
                          className={cn(
                            'p-2.5 rounded-lg border transition-all flex items-start justify-between gap-3 select-text',
                            isBulletSelected
                              ? 'bg-warning/20 border-warning ring-2 ring-warning/60 shadow-md'
                              : flagged
                                ? 'bg-warning/10 border-warning/30'
                                : 'bg-card/40 border-border/60 hover:border-border hover:bg-muted/30',
                          )}
                        >
                          <div className="flex-1">
                            <span className="text-xs sm:text-sm">{b}</span>
                            {flagged && (
                              <div className="flex items-center gap-1.5 text-xs text-warning font-mono mt-1">
                                <Hash className="w-3 h-3" />
                                <span>Flagged: {flagged.flaggedNumbers.join(', ')}</span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openInspector({
                                type: 'bullet',
                                claim: b,
                                sourceId: exp.sourceExperienceId,
                                sourceTitle: `${exp.title} @ ${exp.company}`,
                                validationStatus: flagged ? 'FLAGGED' : 'VERIFIED',
                                flagReason: flagged?.reason,
                                flaggedNumbers: flagged?.flaggedNumbers,
                                candidateRecord: matchedCandidateExp,
                              })
                            }
                            className={`p-1.5 rounded-md border text-xs shrink-0 cursor-pointer transition-colors ${
                              flagged
                                ? 'bg-warning/20 text-warning border-warning/40 hover:bg-warning/30'
                                : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80'
                            }`}
                            title={
                              flagged
                                ? 'Metric review required — click to inspect ground truth'
                                : 'Verified claim — click to inspect ground truth'
                            }
                          >
                            {flagged ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Featured Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-brand-pink dark:text-brand-cyan uppercase tracking-wider">
                Featured Projects & Evidence Audits
              </h3>
              <span className="text-xs text-muted-foreground">
                Double-click any project or bullet to jump to audit evidence
              </span>
            </div>

            {resume.projects.map((proj: any, i: number) => {
              const matchedCandidateProj = candidateProfile?.projects?.find(
                (cp: any) => cp.id === proj.sourceProjectId,
              );
              const isSourceSelected =
                (activeTarget?.type === 'source' && activeTarget.key === proj.sourceProjectId) ||
                (activeTarget?.type === 'bullet' && activeTarget.sourceId === proj.sourceProjectId);

              return (
                <div
                  key={i}
                  id={`resume-source-${proj.sourceProjectId}`}
                  className={cn(
                    'p-4 rounded-xl border transition-all space-y-2.5',
                    isSourceSelected
                      ? 'border-brand-cyan/70 bg-brand-cyan/5 ring-1 ring-brand-cyan/40 shadow-sm'
                      : 'border-border/80 bg-background/50',
                  )}
                >
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer select-text"
                    onDoubleClick={() =>
                      onSelectTarget?.({
                        type: 'source',
                        key: proj.sourceProjectId,
                        timestamp: Date.now(),
                      })
                    }
                    title="Double-click to locate project in audit panel (Overleaf style)"
                  >
                    <h4 className="text-base font-semibold text-foreground">{proj.name}</h4>

                    <button
                      type="button"
                      onClick={() =>
                        openInspector({
                          type: 'project',
                          claim: proj.name,
                          sourceId: proj.sourceProjectId,
                          sourceTitle: proj.name,
                          validationStatus: matchedCandidateProj ? 'VERIFIED' : 'UNVERIFIED',
                          candidateRecord: matchedCandidateProj,
                        })
                      }
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Inspect project in candidate profile"
                    >
                      <FolderGit2 className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>{proj.sourceProjectId?.slice(0, 8)}...</span>
                      <Search className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>

                  <ul className="space-y-2 text-sm text-foreground/90 leading-relaxed">
                    {proj.bullets?.map((b: string, bIdx: number) => {
                      const flagged = numberFlags.find((f) => f.bullet.trim() === b.trim());
                      const isBulletSelected =
                        activeTarget?.type === 'bullet' &&
                        (activeTarget.key.trim() === b.trim() ||
                          b.includes(activeTarget.key) ||
                          activeTarget.key.includes(b));

                      return (
                        <li
                          key={bIdx}
                          data-bullet-text={encodeURIComponent(b.trim())}
                          onDoubleClick={() =>
                            onSelectTarget?.({
                              type: 'bullet',
                              key: b,
                              sourceId: proj.sourceProjectId,
                              timestamp: Date.now(),
                            })
                          }
                          title="Double-click to jump to audit evidence (Overleaf style)"
                          className={cn(
                            'p-2.5 rounded-lg border transition-all flex items-start justify-between gap-3 select-text',
                            isBulletSelected
                              ? 'bg-warning/20 border-warning ring-2 ring-warning/60 shadow-md'
                              : flagged
                                ? 'bg-warning/10 border-warning/30'
                                : 'bg-card/40 border-border/60 hover:border-border hover:bg-muted/30',
                          )}
                        >
                          <div className="flex-1">
                            <span className="text-xs sm:text-sm">{b}</span>
                            {flagged && (
                              <div className="flex items-center gap-1.5 text-xs text-warning font-mono mt-1">
                                <Hash className="w-3 h-3" />
                                <span>Flagged: {flagged.flaggedNumbers.join(', ')}</span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openInspector({
                                type: 'bullet',
                                claim: b,
                                sourceId: proj.sourceProjectId,
                                sourceTitle: proj.name,
                                validationStatus: flagged ? 'FLAGGED' : 'VERIFIED',
                                flagReason: flagged?.reason,
                                flaggedNumbers: flagged?.flaggedNumbers,
                                candidateRecord: matchedCandidateProj,
                              })
                            }
                            className={`p-1.5 rounded-md border text-xs shrink-0 cursor-pointer transition-colors ${
                              flagged
                                ? 'bg-warning/20 text-warning border-warning/40 hover:bg-warning/30'
                                : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80'
                            }`}
                            title="Inspect ground-truth evidence"
                          >
                            {flagged ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-brand-cyan uppercase tracking-wider mb-2">
              Education
            </h3>
            {resume.education.map((edu: any, i: number) => (
              <div key={i} className="text-xs text-foreground/90">
                <span className="font-semibold text-foreground">{edu.degree}</span>
                {edu.institution && <span> — {edu.institution}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <EvidenceInspectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        evidence={inspectedEvidence}
      />
    </>
  );
}
