'use client';

import type { ValidationReport } from '@praman/schemas';
import {
  AlertTriangle,
  Award,
  Briefcase,
  CheckCircle2,
  FolderGit2,
  Hash,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import {
  EvidenceInspectorModal,
  type InspectedEvidence,
} from '@/components/EvidenceInspectorModal';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ResumeViewerProps {
  resume: any;
  validationReport?: ValidationReport | null;
  candidateProfile?: any;
}

export function ResumeViewer({ resume, validationReport, candidateProfile }: ResumeViewerProps) {
  const [inspectedEvidence, setInspectedEvidence] = useState<InspectedEvidence | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openInspector = (evidence: InspectedEvidence) => {
    setInspectedEvidence(evidence);
    setIsModalOpen(true);
  };

  const numberFlags = validationReport?.numberFlags || [];
  const skillChecks = validationReport?.skillChecks || [];

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
              <span className="text-[11px] text-muted-foreground">
                Click any skill to view profile verification
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

                return (
                  <button
                    type="button"
                    key={i}
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
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all bg-muted/60 border-border hover:border-brand-cyan/50 hover:bg-muted cursor-pointer text-left"
                  >
                    <Award className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                    <span className="text-foreground">{sk}</span>
                    {check?.candidateLevel && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-background/80 text-muted-foreground border border-border">
                        {check.candidateLevel}
                      </span>
                    )}
                    {isAllowed ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
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
              <span className="text-[11px] text-muted-foreground">
                Hover or click bullets to inspect ground truth
              </span>
            </div>

            {resume.experience.map((exp: any, i: number) => {
              const matchedCandidateExp = candidateProfile?.experiences?.find(
                (ce: any) => ce.id === exp.sourceExperienceId,
              );

              return (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
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

                      return (
                        <li
                          key={bIdx}
                          className={`p-2.5 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                            flagged
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-card/40 border-border/60 hover:border-border hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex-1">
                            <span className="text-xs sm:text-sm">{b}</span>
                            {flagged && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono mt-1">
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
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80'
                            }`}
                            title={
                              flagged
                                ? 'Metric review required — click to inspect ground truth'
                                : 'Verified claim — click to inspect ground truth'
                            }
                          >
                            {flagged ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
              <span className="text-[11px] text-muted-foreground">
                Click project badges to inspect profile records
              </span>
            </div>

            {resume.projects.map((proj: any, i: number) => {
              const matchedCandidateProj = candidateProfile?.projects?.find(
                (cp: any) => cp.id === proj.sourceProjectId,
              );

              return (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border/80 bg-background/50 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
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

                      return (
                        <li
                          key={bIdx}
                          className={`p-2.5 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                            flagged
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-card/40 border-border/60 hover:border-border hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex-1">
                            <span className="text-xs sm:text-sm">{b}</span>
                            {flagged && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono mt-1">
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
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80'
                            }`}
                            title="Inspect ground-truth evidence"
                          >
                            {flagged ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
