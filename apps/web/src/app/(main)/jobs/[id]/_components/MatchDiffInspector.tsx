'use client';

import type { MatchAnalysis, StructuredJd } from '@praman/schemas';
import {
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  FolderGit2,
  Layers,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUrlTab } from '@/hooks/useUrlTab';
import { SkillClaimTuningDialog } from './SkillClaimTuningDialog';

interface MatchDiffInspectorProps {
  analysis: MatchAnalysis;
  structured?: StructuredJd;
  candidateProfile?: any;
  onRunStage?: () => void;
  isRunning?: boolean;
}

type FilterMode = 'all' | 'matches' | 'gaps';

const VALID_FILTERS: readonly FilterMode[] = ['all', 'matches', 'gaps'];

export function MatchDiffInspector({
  analysis,
  structured,
  candidateProfile,
  onRunStage,
  isRunning = false,
}: MatchDiffInspectorProps) {
  const [filter, setFilter] = useUrlTab<FilterMode>({
    paramName: 'matchFilter',
    defaultValue: 'all',
    validValues: VALID_FILTERS,
  });
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [tuningSkill, setTuningSkill] = useState<{
    name: string;
    type?: 'required' | 'preferred';
    existingSkill?: any;
  } | null>(null);
  const [hasModifiedClaims, setHasModifiedClaims] = useState(false);

  const candidateSkillsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const sk of candidateProfile?.skills || []) {
      if (sk?.name) map.set(sk.name.toLowerCase().trim(), sk);
    }
    return map;
  }, [candidateProfile?.skills]);

  const strongSet = useMemo(
    () => new Set((analysis.strongMatches || []).map((s) => s.toLowerCase())),
    [analysis.strongMatches],
  );
  const partialSet = useMemo(
    () => new Set((analysis.partialMatches || []).map((s) => s.toLowerCase())),
    [analysis.partialMatches],
  );
  const missingSet = useMemo(
    () => new Set((analysis.missingSkills || []).map((s) => s.toLowerCase())),
    [analysis.missingSkills],
  );
  const doNotClaimSet = useMemo(
    () => new Set((analysis.doNotClaim || []).map((s) => s.toLowerCase())),
    [analysis.doNotClaim],
  );

  // Combine JD skills with source tag
  const allJdSkills = useMemo(() => {
    const list: {
      name: string;
      type: 'required' | 'preferred';
      status: 'strong' | 'partial' | 'missing' | 'unknown';
      isDoNotClaim: boolean;
    }[] = [];
    const seen = new Set<string>();

    for (const skill of structured?.requiredSkills || []) {
      const lower = skill.toLowerCase();
      seen.add(lower);
      let status: 'strong' | 'partial' | 'missing' | 'unknown' = 'unknown';
      if (strongSet.has(lower)) status = 'strong';
      else if (partialSet.has(lower)) status = 'partial';
      else if (missingSet.has(lower)) status = 'missing';

      list.push({
        name: skill,
        type: 'required',
        status,
        isDoNotClaim: doNotClaimSet.has(lower),
      });
    }

    for (const skill of structured?.preferredSkills || []) {
      const lower = skill.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      let status: 'strong' | 'partial' | 'missing' | 'unknown' = 'unknown';
      if (strongSet.has(lower)) status = 'strong';
      else if (partialSet.has(lower)) status = 'partial';
      else if (missingSet.has(lower)) status = 'missing';

      list.push({
        name: skill,
        type: 'preferred',
        status,
        isDoNotClaim: doNotClaimSet.has(lower),
      });
    }

    // Also include any missing skills from analysis that weren't in structured skills list
    for (const skill of analysis.missingSkills || []) {
      const lower = skill.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push({
          name: skill,
          type: 'required',
          status: 'missing',
          isDoNotClaim: doNotClaimSet.has(lower),
        });
      }
    }

    return list;
  }, [structured, strongSet, partialSet, missingSet, doNotClaimSet, analysis.missingSkills]);

  // Filter skills based on current filter mode
  const filteredSkills = useMemo(() => {
    if (filter === 'matches') {
      return allJdSkills.filter((s) => s.status === 'strong' || s.status === 'partial');
    }
    if (filter === 'gaps') {
      return allJdSkills.filter((s) => s.status === 'missing');
    }
    return allJdSkills;
  }, [allJdSkills, filter]);

  // Relevant candidate experiences
  const relevantExperiences = useMemo(() => {
    const all = candidateProfile?.experiences || [];
    const relevantIds = new Set(analysis.relevantExperience || []);
    if (relevantIds.size > 0) {
      const matched = all.filter((e: any) => relevantIds.has(e.id));
      if (matched.length > 0) return matched;
    }
    return all.slice(0, 3);
  }, [candidateProfile?.experiences, analysis.relevantExperience]);

  // Relevant candidate projects
  const relevantProjects = useMemo(() => {
    const all = candidateProfile?.projects || [];
    const relevantIds = new Set(analysis.relevantProjects || []);
    if (relevantIds.size > 0) {
      const matched = all.filter((p: any) => relevantIds.has(p.id));
      if (matched.length > 0) return matched;
    }
    return all.slice(0, 2);
  }, [candidateProfile?.projects, analysis.relevantProjects]);

  const handleStartTune = (name: string, type?: 'required' | 'preferred') => {
    const existing = candidateSkillsMap.get(name.toLowerCase().trim());
    setTuningSkill({
      name,
      type,
      existingSkill: existing || null,
    });
  };

  const highlightBullet = (text: string) => {
    if (!selectedSkill) return text;
    const regex = new RegExp(`(${selectedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          className="bg-brand-cyan/25 text-brand-cyan font-bold px-1 rounded transition-colors"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const matchesSelected = (text: string) => {
    if (!selectedSkill) return false;
    return text.toLowerCase().includes(selectedSkill.toLowerCase());
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Alert Banner: Modified Claims Prompt Re-evaluation */}
      {hasModifiedClaims && (
        <div className="p-3.5 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-brand-cyan/5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Candidate Skills Updated</p>
              <p className="text-xs text-muted-foreground">
                Skill levels have been updated. Re-run Stage 2 to recalculate alignment with the
                latest profile.
              </p>
            </div>
          </div>
          {onRunStage && (
            <Button
              size="sm"
              onClick={onRunStage}
              disabled={isRunning}
              className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              {isRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-dark" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isRunning ? 'Re-analyzing...' : 'Re-run Stage 2 Match'}</span>
            </Button>
          )}
        </div>
      )}

      {/* Interactive Control Header */}
      <Card className="p-3.5 border-border bg-card/70 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">
                Match Diff & Evidence Inspector
              </h4>
              <p className="text-xs text-muted-foreground">
                Side-by-side verification between Target JD Requirements and Candidate Ground-Truth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Mode Buttons */}
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Items ({allJdSkills.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('matches')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === 'matches'
                    ? 'bg-background text-brand-cyan shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Matches (
                {(analysis.strongMatches?.length || 0) + (analysis.partialMatches?.length || 0)})
              </button>
              <button
                type="button"
                onClick={() => setFilter('gaps')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === 'gaps'
                    ? 'bg-background text-brand-pink shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Gaps & Missing ({analysis.missingSkills?.length || 0})
              </button>
            </div>

            {selectedSkill && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSkill(null)}
                className="h-7 text-xs border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 gap-1"
              >
                <span>Active: {selectedSkill}</span>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Dual Column Comparison Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Target Job Prerequisites (JD Lens) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <Card className="p-4 border-border bg-card/60 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-cyan" />
                <h4 className="text-sm font-semibold text-foreground">Target JD Requirements</h4>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-border bg-muted/60">
                {filteredSkills.length} Skills Analyzed
              </Badge>
            </div>

            {/* Skills Status Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prerequisite Skills & Status
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredSkills.map((skill, idx) => {
                  const isSelected = selectedSkill?.toLowerCase() === skill.name.toLowerCase();
                  const candidateSkill = candidateSkillsMap.get(skill.name.toLowerCase().trim());

                  let statusBadge = (
                    <Badge
                      variant="outline"
                      className="text-2xs bg-muted/50 text-muted-foreground border-border"
                    >
                      Untracked
                    </Badge>
                  );

                  let cardStyle =
                    'border-border bg-muted/20 hover:border-border/80 text-foreground';

                  if (skill.status === 'strong') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-2xs font-medium text-brand-cyan">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                      </span>
                    );
                    cardStyle = isSelected
                      ? 'border-brand-cyan bg-brand-cyan/25 shadow-xs shadow-brand-cyan/20'
                      : 'border-brand-cyan/30 bg-brand-cyan/10 hover:border-brand-cyan/60';
                  } else if (skill.status === 'partial') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-2xs font-medium text-success">
                        <Sparkles className="w-2.5 h-2.5" /> Partial
                      </span>
                    );
                    cardStyle = isSelected
                      ? 'border-success bg-success/25 shadow-xs'
                      : 'border-success/30 bg-success/10 hover:border-success/60';
                  } else if (skill.status === 'missing') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-2xs font-medium text-brand-pink">
                        <XCircle className="w-2.5 h-2.5" /> Missing
                      </span>
                    );
                    cardStyle = isSelected
                      ? 'border-brand-pink bg-brand-pink/25 shadow-xs'
                      : 'border-brand-pink/30 bg-brand-pink/10 hover:border-brand-pink/60';
                  }

                  return (
                    <div
                      key={`skill-${idx}`}
                      className={`px-2 py-1 rounded-lg border text-xs flex items-center justify-between gap-1.5 transition-all ${cardStyle}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSkill(isSelected ? null : skill.name)}
                        className="flex items-center gap-1.5 cursor-pointer text-left flex-1 min-w-0"
                      >
                        <span className="font-mono font-medium text-foreground truncate">
                          {skill.name}
                        </span>
                        <span className="text-2xs text-muted-foreground font-sans shrink-0">
                          • {skill.type === 'required' ? 'Req' : 'Pref'}
                        </span>
                        {statusBadge}
                      </button>

                      {/* Profile level indicator + tune claim trigger */}
                      <button
                        type="button"
                        title={
                          candidateSkill
                            ? `Ground-truth claim: ${candidateSkill.level}. Click to tune.`
                            : 'Unclaimed in profile. Click to add/tune claim.'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTune(skill.name, skill.type);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-card/60 hover:bg-muted border border-border/60 text-2xs font-mono text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-colors"
                      >
                        <SlidersHorizontal className="w-2.5 h-2.5 text-brand-cyan" />
                        <span className="hidden sm:inline">
                          {candidateSkill ? candidateSkill.level.slice(0, 4) : 'Tune'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Responsibilities list if available */}
            {structured?.responsibilities && structured.responsibilities.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Expected JD Responsibilities ({structured.responsibilities.length})
                </span>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {structured.responsibilities.slice(0, 4).map((resp, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-brand-cyan text-xs font-mono">•</span>
                      <span>{highlightBullet(resp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Experience or Education Discrepancies */}
            {(analysis.experienceGaps?.length ?? 0) > 0 ||
            (analysis.educationGaps?.length ?? 0) > 0 ? (
              <div className="p-3 rounded-lg border border-brand-pink/30 bg-brand-pink/10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-pink">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Prerequisite Gaps Identified</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {analysis.experienceGaps?.map((gap, i) => (
                    <div key={`eg-${i}`} className="flex items-start gap-1.5">
                      <span className="text-brand-pink font-bold font-mono">-</span>
                      <span>Experience: {gap}</span>
                    </div>
                  ))}
                  {analysis.educationGaps?.map((gap, i) => (
                    <div key={`ed-${i}`} className="flex items-start gap-1.5">
                      <span className="text-brand-pink font-bold font-mono">-</span>
                      <span>Education: {gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Candidate Evidence Ledger (Ground Truth) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <Card className="p-4 border-border bg-card/60 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-success" />
                <h4 className="text-sm font-semibold text-foreground">Candidate Evidence Ledger</h4>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-border bg-muted/60">
                Ground-Truth Verified
              </Badge>
            </div>

            {/* Linked Verified Experiences */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target-Aligned Experience Records ({relevantExperiences.length})
              </span>

              {relevantExperiences.map((exp: any) => {
                const isItemFocused =
                  selectedSkill &&
                  (exp.technologies?.some((t: string) =>
                    t.toLowerCase().includes(selectedSkill.toLowerCase()),
                  ) ||
                    exp.bullets?.some((b: string) => matchesSelected(b)));

                return (
                  <div
                    key={exp.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isItemFocused
                        ? 'border-brand-cyan/60 bg-brand-cyan/5 shadow-xs'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h5 className="text-xs font-semibold text-foreground truncate">
                        {exp.role}{' '}
                        <span className="text-muted-foreground font-normal">@ {exp.company}</span>
                      </h5>
                      <span className="text-2xs font-mono text-muted-foreground shrink-0">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>

                    <ul className="space-y-1 mb-2 text-xs text-muted-foreground">
                      {exp.bullets?.slice(0, 2).map((bullet: string, bIdx: number) => (
                        <li key={bIdx} className="leading-relaxed flex items-start gap-1.5">
                          <span className="text-brand-cyan font-mono text-2xs mt-0.5">▸</span>
                          <span>{highlightBullet(bullet)}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tech tokens */}
                    <div className="flex flex-wrap gap-1">
                      {exp.technologies?.map((tech: string, tIdx: number) => {
                        const isTechMatched = strongSet.has(tech.toLowerCase());
                        const isTechSelected = selectedSkill?.toLowerCase() === tech.toLowerCase();

                        return (
                          <span
                            key={tIdx}
                            onClick={() => setSelectedSkill(isTechSelected ? null : tech)}
                            className={`text-2xs font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                              isTechSelected
                                ? 'bg-brand-cyan text-brand-dark font-bold'
                                : isTechMatched
                                  ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                                  : 'bg-muted/60 text-muted-foreground border border-border'
                            }`}
                          >
                            {tech}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Linked Projects */}
            {relevantProjects.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>Aligned Portfolio Projects ({relevantProjects.length})</span>
                </span>

                {relevantProjects.map((proj: any) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-semibold text-foreground">{proj.title}</h5>
                      <span className="text-2xs text-muted-foreground font-mono">
                        {proj.role}
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {proj.bullets?.slice(0, 1).map((b: string, i: number) => (
                        <li key={i} className="leading-relaxed flex items-start gap-1.5">
                          <span className="text-success font-mono text-2xs mt-0.5">▸</span>
                          <span>{highlightBullet(b)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Do Not Claim / Boundary Safeguard Alert */}
            {(analysis.doNotClaim?.length ?? 0) > 0 && (
              <div className="p-3.5 rounded-xl border border-brand-pink/40 bg-brand-pink/10 space-y-2">
                <div className="flex items-center gap-2 text-brand-pink">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <h5 className="text-xs font-bold uppercase tracking-wider">
                    Ground-Truth Boundaries: Do Not Claim
                  </h5>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These JD requirements were identified as unverified or marked as NOT_LEARNED in
                  candidate profile. The resume generator is strictly forbidden from fabricating
                  claims for:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {analysis.doNotClaim?.map((item: string, i: number) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs font-mono px-2 py-0.5 rounded bg-brand-pink/20 text-brand-pink border-brand-pink/40 font-semibold"
                    >
                      <AlertOctagon className="w-2.5 h-2.5 mr-1" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Claim Tuning Dialog */}
      {tuningSkill && (
        <SkillClaimTuningDialog
          isOpen={!!tuningSkill}
          onOpenChange={(open) => {
            if (!open) setTuningSkill(null);
          }}
          skillName={tuningSkill.name}
          existingSkill={tuningSkill.existingSkill}
          jdType={tuningSkill.type}
          onSaved={() => {
            setHasModifiedClaims(true);
          }}
        />
      )}
    </div>
  );
}
