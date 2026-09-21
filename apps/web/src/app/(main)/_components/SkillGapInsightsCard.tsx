'use client';

import type { CandidateProfile, JobDescriptionRecord } from '@praman/schemas';
import { AlertCircle, ArrowUpRight, CheckCircle2, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface SkillGapInsightsCardProps {
  jobs: JobDescriptionRecord[];
  profile?: CandidateProfile | null;
}

export const SkillGapInsightsCard: React.FC<SkillGapInsightsCardProps> = ({ jobs, profile }) => {
  // Extract all missing skills across jobs that have analysis
  const missingSkillFrequency: Record<string, number> = {};
  const inDemandSkillFrequency: Record<string, number> = {};
  let totalAnalyzedJobs = 0;
  let totalStrongMatches = 0;
  let totalMissingRequirements = 0;

  jobs.forEach((j) => {
    // Collect required skills from structured JD
    const structuredSkills = [
      ...(j.structured?.requiredSkills || []),
      ...(j.structured?.mustHave || []),
    ];
    structuredSkills.forEach((skill) => {
      const normalized = skill.trim();
      if (normalized) {
        inDemandSkillFrequency[normalized] = (inDemandSkillFrequency[normalized] || 0) + 1;
      }
    });

    // Collect analyzed match results
    const analysis = j.analysis?.result;
    if (analysis) {
      totalAnalyzedJobs += 1;
      const missing = analysis.missingSkills || [];
      const strong = analysis.strongMatches || [];

      totalStrongMatches += strong.length;
      totalMissingRequirements += missing.length;

      missing.forEach((item: string) => {
        const normalized = item.trim();
        if (normalized) {
          missingSkillFrequency[normalized] = (missingSkillFrequency[normalized] || 0) + 1;
        }
      });
    }
  });

  // Calculate market readiness score
  const totalRequirements = totalStrongMatches + totalMissingRequirements;
  const marketReadinessScore =
    totalRequirements > 0 ? Math.round((totalStrongMatches / totalRequirements) * 100) : 0;

  // Sort missing skills by frequency (descending)
  const topMissingSkills = Object.entries(missingSkillFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Sort in-demand skills by frequency (descending)
  const topInDemandSkills = Object.entries(inDemandSkillFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const candidateSkillNames = new Set((profile?.skills || []).map((s) => s.name.toLowerCase()));

  return (
    <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Market Skill Gap Insights</h3>
            <p className="text-xs text-muted-foreground">
              Cross-job requirement intelligence across {totalAnalyzedJobs} analyzed position
              {totalAnalyzedJobs === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {totalAnalyzedJobs > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground">Match Readiness:</span>
            <span className="text-xs font-mono font-bold text-brand-cyan">
              {marketReadinessScore}%
            </span>
          </div>
        )}
      </div>

      {totalAnalyzedJobs === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            Run the AI match pipeline on your saved jobs to reveal market skill gaps and in-demand
            technologies.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
          >
            <span>View your pipeline</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top In-Demand Technologies */}
          <div>
            <span className="text-xs font-semibold text-foreground block mb-2">
              Most Requested Technologies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topInDemandSkills.map(([skill, count]) => {
                const isPossessed = candidateSkillNames.has(skill.toLowerCase());
                return (
                  <Badge
                    key={skill}
                    variant="outline"
                    className={`text-xs py-0.5 px-2.5 gap-1.5 ${
                      isPossessed
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-border bg-muted/30 text-foreground/80'
                    }`}
                  >
                    {isPossessed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    <span>{skill}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({count} JDs)
                    </span>
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* High-Impact Skill Gaps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>High-Impact Skill Gaps:</span>
              </span>
              <Link
                href="/profile"
                className="text-[11px] text-brand-cyan hover:underline flex items-center gap-0.5"
              >
                <span>Update Profile Skills</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {topMissingSkills.length === 0 ? (
              <p className="text-xs text-emerald-400 font-medium">
                🎉 No recurring skill gaps detected across your analyzed jobs!
              </p>
            ) : (
              <div className="space-y-2">
                {topMissingSkills.map(([skill, count]) => (
                  <div
                    key={skill}
                    className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground block">{skill}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Missing in {count} of your target position{count === 1 ? '' : 's'}
                      </span>
                    </div>

                    <Link
                      href="/profile"
                      className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-semibold text-[11px] transition-colors shrink-0"
                    >
                      Add Evidence
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
