'use client';

import type { ResumeVersionSummary } from '@praman/schemas';
import { cn } from 'cn';
import {
  ArrowLeftRight,
  Award,
  Briefcase,
  FileText,
  Filter,
  FolderGit2,
  GitCompare,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobResume } from '@/hooks/usePramanApi';
import { useUrlQueryParam } from '@/hooks/useUrlParams';
import {
  type BulletDiffItem,
  diffBullets,
  diffSkills,
  diffWords,
  type WordDiffPart,
} from '@/lib/diff';

interface ResumeDiffViewerProps {
  jobId: string;
  currentResume: any;
  currentVersion?: string | number;
  versions?: ResumeVersionSummary[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function ResumeDiffViewer({
  jobId,
  currentResume,
  currentVersion,
  versions = [],
  onRegenerate,
  isRegenerating,
}: ResumeDiffViewerProps) {
  // Sort versions descending (newest first)
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => (b.version || 0) - (a.version || 0));
  }, [versions]);

  // Determine smart defaults: Target = current/latest, Base = previous version if available
  const defaultTarget = useMemo(() => {
    if (currentVersion !== undefined) return currentVersion.toString();
    if (sortedVersions.length > 0) return sortedVersions[0].version?.toString() || 'latest';
    return 'latest';
  }, [currentVersion, sortedVersions]);

  const defaultBase = useMemo(() => {
    if (sortedVersions.length > 1) {
      // Find the one right before target if possible
      const targetIdx = sortedVersions.findIndex((v) => v.version?.toString() === defaultTarget);
      if (targetIdx !== -1 && targetIdx + 1 < sortedVersions.length) {
        return sortedVersions[targetIdx + 1].version?.toString() || '1';
      }
      return sortedVersions[1].version?.toString() || '1';
    }
    return sortedVersions[0]?.version?.toString() || '1';
  }, [sortedVersions, defaultTarget]);

  const [baseVersionParam, setBaseVersionParam] = useUrlQueryParam<string>('diffBase');
  const [targetVersionParam, setTargetVersionParam] = useUrlQueryParam<string>('diffTarget');

  const baseVersion = baseVersionParam || defaultBase;
  const targetVersion = targetVersionParam || defaultTarget;

  const setBaseVersion = (v: string) => setBaseVersionParam(v);
  const setTargetVersion = (v: string) => setTargetVersionParam(v);
  const [changesOnly, setChangesOnly] = useState<boolean>(false);

  // Fetch base and target versions
  const { data: baseData, isLoading: isBaseLoading } = useJobResume(jobId, baseVersion);
  const { data: targetData, isLoading: isTargetLoading } = useJobResume(jobId, targetVersion);

  const baseResume =
    baseData?.resumeJson || (baseVersion === currentVersion?.toString() ? currentResume : null);
  const targetResume =
    targetData?.resumeJson || (targetVersion === currentVersion?.toString() ? currentResume : null);

  const isLoading = isBaseLoading || isTargetLoading;

  // Swap versions
  const handleSwap = () => {
    const temp = baseVersion;
    setBaseVersion(targetVersion);
    setTargetVersion(temp);
  };

  // 1. Diff Skills
  const skillsDiff = useMemo(() => {
    const oldSkills = baseResume?.skills || [];
    const newSkills = targetResume?.skills || [];
    return diffSkills(oldSkills, newSkills);
  }, [baseResume?.skills, targetResume?.skills]);

  // 2. Diff Summary
  const summaryParts = useMemo(() => {
    const oldSummary = baseResume?.summary || '';
    const newSummary = targetResume?.summary || '';
    return diffWords(oldSummary, newSummary);
  }, [baseResume?.summary, targetResume?.summary]);

  const hasSummaryChanged = useMemo(() => {
    return summaryParts.some((p) => p.type !== 'same');
  }, [summaryParts]);

  // 3. Diff Experiences
  const experienceDiffs = useMemo(() => {
    const baseExps: any[] = baseResume?.experience || [];
    const targetExps: any[] = targetResume?.experience || [];

    const matchedPairs: {
      company: string;
      role: string;
      dates?: string;
      bullets: BulletDiffItem[];
      status: 'added' | 'removed' | 'modified' | 'unchanged';
    }[] = [];

    const usedBaseIndices = new Set<number>();

    for (const tExp of targetExps) {
      // Find matching base experience by company + role
      let matchIdx = baseExps.findIndex(
        (bExp, idx) =>
          !usedBaseIndices.has(idx) &&
          bExp.company?.toLowerCase().trim() === tExp.company?.toLowerCase().trim() &&
          bExp.role?.toLowerCase().trim() === tExp.role?.toLowerCase().trim(),
      );

      // Fallback: match by company alone
      if (matchIdx === -1) {
        matchIdx = baseExps.findIndex(
          (bExp, idx) =>
            !usedBaseIndices.has(idx) &&
            bExp.company?.toLowerCase().trim() === tExp.company?.toLowerCase().trim(),
        );
      }

      if (matchIdx !== -1) {
        usedBaseIndices.add(matchIdx);
        const bExp = baseExps[matchIdx];
        const bulletsDiff = diffBullets(bExp.bullets || [], tExp.bullets || []);
        const hasChanges = bulletsDiff.some((b) => b.status !== 'unchanged');

        matchedPairs.push({
          company: tExp.company,
          role: tExp.role,
          dates: tExp.dates || tExp.duration,
          bullets: bulletsDiff,
          status: hasChanges ? 'modified' : 'unchanged',
        });
      } else {
        // Experience was newly added in target
        matchedPairs.push({
          company: tExp.company,
          role: tExp.role,
          dates: tExp.dates || tExp.duration,
          bullets: (tExp.bullets || []).map((b: string) => ({
            status: 'added',
            currentText: b,
          })),
          status: 'added',
        });
      }
    }

    // Unmatched base experiences were removed
    baseExps.forEach((bExp, idx) => {
      if (!usedBaseIndices.has(idx)) {
        matchedPairs.push({
          company: bExp.company,
          role: bExp.role,
          dates: bExp.dates || bExp.duration,
          bullets: (bExp.bullets || []).map((b: string) => ({
            status: 'removed',
            previousText: b,
          })),
          status: 'removed',
        });
      }
    });

    return matchedPairs;
  }, [baseResume?.experience, targetResume?.experience]);

  // 4. Diff Projects
  const projectDiffs = useMemo(() => {
    const baseProjects: any[] = baseResume?.projects || [];
    const targetProjects: any[] = targetResume?.projects || [];

    const matchedPairs: {
      name: string;
      role?: string;
      bullets: BulletDiffItem[];
      techDiff?: { added: string[]; removed: string[]; common: string[] };
      status: 'added' | 'removed' | 'modified' | 'unchanged';
    }[] = [];

    const usedBaseIndices = new Set<number>();

    for (const tProj of targetProjects) {
      const matchIdx = baseProjects.findIndex(
        (bProj, idx) =>
          !usedBaseIndices.has(idx) &&
          bProj.name?.toLowerCase().trim() === tProj.name?.toLowerCase().trim(),
      );

      if (matchIdx !== -1) {
        usedBaseIndices.add(matchIdx);
        const bProj = baseProjects[matchIdx];
        const bulletsDiff = diffBullets(bProj.bullets || [], tProj.bullets || []);
        const techDiff = diffSkills(bProj.technologies || [], tProj.technologies || []);
        const hasChanges =
          bulletsDiff.some((b) => b.status !== 'unchanged') ||
          techDiff.added.length > 0 ||
          techDiff.removed.length > 0;

        matchedPairs.push({
          name: tProj.name,
          role: tProj.role,
          bullets: bulletsDiff,
          techDiff,
          status: hasChanges ? 'modified' : 'unchanged',
        });
      } else {
        matchedPairs.push({
          name: tProj.name,
          role: tProj.role,
          bullets: (tProj.bullets || []).map((b: string) => ({
            status: 'added',
            currentText: b,
          })),
          techDiff: { added: tProj.technologies || [], removed: [], common: [] },
          status: 'added',
        });
      }
    }

    baseProjects.forEach((bProj, idx) => {
      if (!usedBaseIndices.has(idx)) {
        matchedPairs.push({
          name: bProj.name,
          role: bProj.role,
          bullets: (bProj.bullets || []).map((b: string) => ({
            status: 'removed',
            previousText: b,
          })),
          techDiff: { added: [], removed: bProj.technologies || [], common: [] },
          status: 'removed',
        });
      }
    });

    return matchedPairs;
  }, [baseResume?.projects, targetResume?.projects]);

  // Aggregate stats
  const stats = useMemo(() => {
    let bulletsAdded = 0;
    let bulletsRemoved = 0;
    let bulletsModified = 0;

    experienceDiffs.forEach((exp) => {
      exp.bullets.forEach((b) => {
        if (b.status === 'added') bulletsAdded++;
        else if (b.status === 'removed') bulletsRemoved++;
        else if (b.status === 'modified') bulletsModified++;
      });
    });

    projectDiffs.forEach((proj) => {
      proj.bullets.forEach((b) => {
        if (b.status === 'added') bulletsAdded++;
        else if (b.status === 'removed') bulletsRemoved++;
        else if (b.status === 'modified') bulletsModified++;
      });
    });

    return {
      skillsAdded: skillsDiff.added.length,
      skillsRemoved: skillsDiff.removed.length,
      bulletsAdded,
      bulletsRemoved,
      bulletsModified,
      totalChanges:
        skillsDiff.added.length +
        skillsDiff.removed.length +
        bulletsAdded +
        bulletsRemoved +
        bulletsModified +
        (hasSummaryChanged ? 1 : 0),
    };
  }, [skillsDiff, experienceDiffs, projectDiffs, hasSummaryChanged]);

  // If there's only 1 version ever recorded
  if (sortedVersions.length <= 1) {
    return (
      <Card className="p-8 border-border bg-card/90 backdrop-blur-md text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
          <GitCompare className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            Version Diff Requires Multiple Iterations
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Currently, there is only 1 recorded iteration (v
            {sortedVersions[0]?.version || currentVersion || 1}) for this job description.
            Regenerate or customize your resume to create v2 and inspect granular metric diffs
            side-by-side.
          </p>
        </div>
        <div className="pt-2">
          <Button
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRegenerating && 'animate-spin')} />
            <span>Generate Iteration (v2)</span>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diff Controls Header */}
      <Card className="p-4 sm:p-5 border-border bg-card/95 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Iteration Diff Inspector</h3>
                <Badge
                  variant="outline"
                  className="text-2xs font-mono px-2 py-0.5 border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                >
                  {stats.totalChanges} changes detected
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Highlighting metrics, bullet points, and skills evolved between generations.
              </p>
            </div>
          </div>

          {/* Version Selector Selectors & Swap */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Base Version */}
            <div className="flex items-center gap-1.5 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5">
              <span className="text-muted-foreground font-medium text-xs">Base:</span>
              <select
                value={baseVersion}
                onChange={(e) => setBaseVersion(e.target.value)}
                className="bg-transparent text-foreground font-mono font-semibold outline-none cursor-pointer text-xs"
              >
                {sortedVersions.map((v) => (
                  <option
                    key={v.id}
                    value={v.version?.toString()}
                    className="bg-card text-foreground"
                  >
                    v{v.version} {v.isLatest ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="h-8 w-8 border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Swap Base and Target versions"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </Button>

            {/* Target Version */}
            <div className="flex items-center gap-1.5 bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg px-2.5 py-1.5">
              <span className="text-brand-cyan font-medium text-xs">Target:</span>
              <select
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                className="bg-transparent text-brand-cyan font-mono font-bold outline-none cursor-pointer text-xs"
              >
                {sortedVersions.map((v) => (
                  <option
                    key={v.id}
                    value={v.version?.toString()}
                    className="bg-card text-foreground"
                  >
                    v{v.version} {v.isLatest ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Changes Only */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangesOnly(!changesOnly)}
              className={cn(
                'h-8 text-xs gap-1.5 cursor-pointer transition-colors',
                changesOnly
                  ? 'border-brand-cyan bg-brand-cyan/15 text-brand-cyan font-semibold'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <Filter className="w-3 h-3" />
              <span>{changesOnly ? 'Changes Only' : 'Show All'}</span>
            </Button>
          </div>
        </div>

        {/* Change Statistics Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mr-1">
            Diff Summary:
          </span>

          {/* Skills Stats */}
          {stats.skillsAdded > 0 && (
            <Badge className="bg-success/15 border-success/30 text-success font-mono text-xs gap-1 px-2 py-0.5">
              <Plus className="w-3 h-3" />
              <span>{stats.skillsAdded} skills added</span>
            </Badge>
          )}
          {stats.skillsRemoved > 0 && (
            <Badge className="bg-destructive/15 border-destructive/30 text-destructive font-mono text-xs gap-1 px-2 py-0.5">
              <Minus className="w-3 h-3" />
              <span>{stats.skillsRemoved} skills removed</span>
            </Badge>
          )}

          {/* Bullets Stats */}
          {stats.bulletsModified > 0 && (
            <Badge className="bg-warning/15 border-warning/30 text-warning font-mono text-xs gap-1 px-2 py-0.5">
              <Sparkles className="w-3 h-3" />
              <span>{stats.bulletsModified} bullets refined</span>
            </Badge>
          )}
          {stats.bulletsAdded > 0 && (
            <Badge className="bg-success/15 border-success/30 text-success font-mono text-xs gap-1 px-2 py-0.5">
              <Plus className="w-3 h-3" />
              <span>{stats.bulletsAdded} bullets added</span>
            </Badge>
          )}
          {stats.bulletsRemoved > 0 && (
            <Badge className="bg-destructive/15 border-destructive/30 text-destructive font-mono text-xs gap-1 px-2 py-0.5">
              <Minus className="w-3 h-3" />
              <span>{stats.bulletsRemoved} bullets removed</span>
            </Badge>
          )}

          {stats.totalChanges === 0 && (
            <span className="text-xs text-muted-foreground italic">
              No differences found between v{baseVersion} and v{targetVersion}.
            </span>
          )}
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl bg-card border border-border" />
          <Skeleton className="h-48 w-full rounded-2xl bg-card border border-border" />
          <Skeleton className="h-64 w-full rounded-2xl bg-card border border-border" />
        </div>
      ) : baseVersion === targetVersion ? (
        <Card className="p-8 border-border bg-card/80 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">
            Comparing identical versions (v{baseVersion} vs v{targetVersion})
          </p>
          <p className="text-xs text-muted-foreground">
            Please pick a different Base or Target version from the dropdown above to inspect diffs.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: Technical Skills Diff */}
          {(skillsDiff.added.length > 0 ||
            skillsDiff.removed.length > 0 ||
            (!changesOnly && skillsDiff.common.length > 0)) && (
            <Card className="p-5 sm:p-6 border-border bg-card/80 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-pink dark:text-brand-cyan flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Technical Skills & Proficiency Diff</span>
                </h4>
                <span className="text-xs text-muted-foreground font-mono">
                  +{skillsDiff.added.length} / -{skillsDiff.removed.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Added Skills */}
                {skillsDiff.added.map((sk) => (
                  <Badge
                    key={`added-${sk}`}
                    className="bg-success/15 border-success/40 text-success font-mono text-xs px-2.5 py-1 gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>{sk}</span>
                    <span className="text-2xs uppercase tracking-wider font-bold bg-success/20 px-1 rounded">
                      NEW
                    </span>
                  </Badge>
                ))}

                {/* Removed Skills */}
                {skillsDiff.removed.map((sk) => (
                  <Badge
                    key={`removed-${sk}`}
                    className="bg-destructive/15 border-destructive/40 text-destructive line-through font-mono text-xs px-2.5 py-1 gap-1.5 shadow-xs opacity-75"
                  >
                    <Minus className="w-3 h-3 shrink-0" />
                    <span>{sk}</span>
                    <span className="text-2xs uppercase tracking-wider font-bold bg-destructive/20 px-1 rounded no-underline">
                      REMOVED
                    </span>
                  </Badge>
                ))}

                {/* Common/Unchanged Skills */}
                {!changesOnly &&
                  skillsDiff.common.map((sk) => (
                    <Badge
                      key={`common-${sk}`}
                      variant="outline"
                      className="border-border/80 bg-muted/30 text-muted-foreground font-mono text-xs px-2.5 py-1"
                    >
                      <span>{sk}</span>
                    </Badge>
                  ))}
              </div>
            </Card>
          )}

          {/* SECTION 2: Professional Summary Diff */}
          {(!changesOnly || hasSummaryChanged) && (
            <Card className="p-5 sm:p-6 border-border bg-card/80 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-pink dark:text-brand-cyan flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Professional Summary Diff</span>
                </h4>
                {hasSummaryChanged ? (
                  <Badge className="bg-warning/15 border-warning/30 text-warning font-mono text-2xs px-2 py-0.5">
                    MODIFIED
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-border text-muted-foreground text-2xs">
                    UNCHANGED
                  </Badge>
                )}
              </div>

              <div className="text-xs sm:text-sm leading-relaxed p-3.5 rounded-xl border border-border/60 bg-background/60">
                <DiffText parts={summaryParts} />
              </div>
            </Card>
          )}

          {/* SECTION 3: Work Experience & Evidence Diff */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-pink dark:text-brand-cyan flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Work Experience & Metric Diff</span>
              </h4>
              <span className="text-xs text-muted-foreground">
                Green = Added / Enhanced • Red = Removed / Replaced
              </span>
            </div>

            {experienceDiffs.map((exp, idx) => {
              if (changesOnly && exp.status === 'unchanged') return null;

              return (
                <Card
                  key={idx}
                  className={cn(
                    'p-5 border space-y-4 transition-all',
                    exp.status === 'added' && 'border-success/40 bg-success/5',
                    exp.status === 'removed' && 'border-destructive/40 bg-destructive/5 opacity-75',
                    exp.status === 'modified' && 'border-border bg-card/80 backdrop-blur-md',
                    exp.status === 'unchanged' && 'border-border/70 bg-card/50',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-foreground">{exp.role}</h5>
                        {exp.status === 'added' && (
                          <Badge className="bg-success/20 text-success border-success/40 text-2xs font-mono">
                            + NEW ROLE
                          </Badge>
                        )}
                        {exp.status === 'removed' && (
                          <Badge className="bg-destructive/20 text-destructive border-destructive/40 text-2xs font-mono">
                            - REMOVED
                          </Badge>
                        )}
                        {exp.status === 'modified' && (
                          <Badge className="bg-warning/20 text-warning border-warning/40 text-2xs font-mono">
                            MODIFIED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {exp.company} {exp.dates ? `• ${exp.dates}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Bullet Points Diff */}
                  <div className="space-y-2.5 pl-1">
                    {exp.bullets.map((bullet, bIdx) => {
                      if (changesOnly && bullet.status === 'unchanged') return null;

                      if (bullet.status === 'added') {
                        return (
                          <div
                            key={bIdx}
                            className="flex items-start gap-2.5 text-xs text-foreground/90 p-2.5 rounded-lg bg-success/10 border border-success/30"
                          >
                            <Plus className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{bullet.currentText}</span>
                          </div>
                        );
                      }

                      if (bullet.status === 'removed') {
                        return (
                          <div
                            key={bIdx}
                            className="flex items-start gap-2.5 text-xs text-muted-foreground p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 line-through opacity-80"
                          >
                            <Minus className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{bullet.previousText}</span>
                          </div>
                        );
                      }

                      if (bullet.status === 'modified' && bullet.parts) {
                        return (
                          <div
                            key={bIdx}
                            className="flex items-start gap-2.5 text-xs text-foreground/90 p-2.5 rounded-lg bg-warning/5 border border-warning/25"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <DiffText parts={bullet.parts} />
                            </div>
                          </div>
                        );
                      }

                      // Unchanged
                      return (
                        <div
                          key={bIdx}
                          className="flex items-start gap-2.5 text-xs text-muted-foreground/80 pl-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0 mt-1.5" />
                          <span className="leading-relaxed">{bullet.currentText}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* SECTION 4: Projects Diff */}
          {projectDiffs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-pink dark:text-brand-cyan flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4" />
                  <span>Projects & Technology Stack Diff</span>
                </h4>
              </div>

              {projectDiffs.map((proj, idx) => {
                if (changesOnly && proj.status === 'unchanged') return null;

                return (
                  <Card
                    key={idx}
                    className={cn(
                      'p-5 border space-y-4 transition-all',
                      proj.status === 'added' && 'border-success/40 bg-success/5',
                      proj.status === 'removed' &&
                        'border-destructive/40 bg-destructive/5 opacity-75',
                      proj.status === 'modified' && 'border-border bg-card/80 backdrop-blur-md',
                      proj.status === 'unchanged' && 'border-border/70 bg-card/50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-foreground">{proj.name}</h5>
                          {proj.status === 'added' && (
                            <Badge className="bg-success/20 text-success border-success/40 text-2xs font-mono">
                              + NEW
                            </Badge>
                          )}
                          {proj.status === 'removed' && (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/40 text-2xs font-mono">
                              - REMOVED
                            </Badge>
                          )}
                          {proj.status === 'modified' && (
                            <Badge className="bg-warning/20 text-warning border-warning/40 text-2xs font-mono">
                              MODIFIED
                            </Badge>
                          )}
                        </div>
                        {proj.role && (
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {proj.role}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Technologies diff */}
                    {proj.techDiff &&
                      (proj.techDiff.added.length > 0 ||
                        proj.techDiff.removed.length > 0 ||
                        (!changesOnly && proj.techDiff.common.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.techDiff.added.map((t) => (
                            <Badge
                              key={t}
                              className="bg-success/15 text-success border-success/30 text-2xs font-mono"
                            >
                              + {t}
                            </Badge>
                          ))}
                          {proj.techDiff.removed.map((t) => (
                            <Badge
                              key={t}
                              className="bg-destructive/15 text-destructive border-destructive/30 line-through text-2xs font-mono"
                            >
                              - {t}
                            </Badge>
                          ))}
                          {!changesOnly &&
                            proj.techDiff.common.map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="border-border text-muted-foreground text-2xs font-mono"
                              >
                                {t}
                              </Badge>
                            ))}
                        </div>
                      )}

                    {/* Bullets */}
                    <div className="space-y-2 pl-1">
                      {proj.bullets.map((bullet, bIdx) => {
                        if (changesOnly && bullet.status === 'unchanged') return null;

                        if (bullet.status === 'added') {
                          return (
                            <div
                              key={bIdx}
                              className="flex items-start gap-2 text-xs text-foreground/90 p-2 rounded bg-success/10 border border-success/30"
                            >
                              <Plus className="w-3 h-3 text-success shrink-0 mt-0.5" />
                              <span>{bullet.currentText}</span>
                            </div>
                          );
                        }

                        if (bullet.status === 'removed') {
                          return (
                            <div
                              key={bIdx}
                              className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded bg-destructive/10 border border-destructive/30 line-through opacity-80"
                            >
                              <Minus className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                              <span>{bullet.previousText}</span>
                            </div>
                          );
                        }

                        if (bullet.status === 'modified' && bullet.parts) {
                          return (
                            <div
                              key={bIdx}
                              className="flex items-start gap-2 text-xs text-foreground/90 p-2 rounded bg-warning/5 border border-warning/25"
                            >
                              <Sparkles className="w-3 h-3 text-warning shrink-0 mt-0.5" />
                              <div>
                                <DiffText parts={bullet.parts} />
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={bIdx}
                            className="flex items-start gap-2 text-xs text-muted-foreground/80"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0 mt-1.5" />
                            <span>{bullet.currentText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Word-level diff renderer component
 */
function DiffText({ parts }: { parts: WordDiffPart[] }) {
  return (
    <span>
      {parts.map((part, idx) => {
        if (part.type === 'added') {
          return (
            <mark
              key={idx}
              className="bg-success/25 text-success font-medium px-1 py-0.2 rounded mx-0.5 inline-block"
            >
              {part.value}
            </mark>
          );
        }
        if (part.type === 'removed') {
          return (
            <del
              key={idx}
              className="bg-destructive/25 text-destructive line-through px-1 py-0.2 rounded mx-0.5 inline-block opacity-80"
            >
              {part.value}
            </del>
          );
        }
        return <span key={idx}>{part.value}</span>;
      })}
    </span>
  );
}
