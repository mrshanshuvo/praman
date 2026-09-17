'use client';

import { CheckCircle2, Database, ExternalLink, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface StatsGridProps {
  profile: any;
}

export function StatsGrid({ profile }: StatsGridProps) {
  const personal = profile?.personal || {};
  const skillsCount = profile?.skills?.length || 0;
  const expCount = profile?.experiences?.length || 0;
  const projCount = profile?.projects?.length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Candidate Profile Card */}
      <Card className="p-6 border-border bg-card shadow-xs space-y-4 gap-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <User className="w-4 h-4 text-brand-cyan" />
            <span>Confirmed Candidate</span>
          </div>
          <Link
            href="/profile"
            className="text-xs text-brand-pink dark:text-brand-cyan hover:underline flex items-center gap-0.5"
          >
            Edit <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground">
            {personal.name || 'Shahid Hasan Shovu'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {personal.title || 'Full-Stack Developer'}
          </p>
          <p className="text-sm text-muted-foreground/80 mt-1">
            {personal.location || 'Dhaka - 1216, Bangladesh'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="block text-xl font-bold font-mono text-brand-cyan">{skillsCount}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Skills</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="block text-xl font-bold font-mono text-brand-pink">{expCount}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Experiences
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="block text-xl font-bold font-mono text-brand-cyan">{projCount}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Projects</span>
          </div>
        </div>
      </Card>

      {/* Database & ORM Stack Card */}
      <Card className="p-6 border-border hover:border-brand-pink/50 transition-colors bg-card shadow-xs space-y-4 gap-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <Database className="w-4 h-4 text-brand-pink" />
            <span>Data Contract & Engine</span>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-mono bg-brand-pink/10 text-brand-pink border-brand-pink/40 font-semibold px-2 py-0.5"
          >
            Prisma 8 PSL
          </Badge>
        </div>

        <div className="space-y-2.5 text-sm text-muted-foreground">
          {[
            { label: 'Database Engine', value: 'Prisma Postgres (Cloud)' },
            { label: 'Schema Contract', value: 'contract.prisma (PSL)' },
            { label: 'Shared Types', value: '@praman/schemas (Zod)' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border"
            >
              <span className="text-muted-foreground text-sm">{label}</span>
              <span className="font-mono text-foreground text-sm">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs text-brand-pink dark:text-brand-cyan">
          <CheckCircle2 className="w-4 h-4 text-brand-pink dark:text-brand-cyan" />
          <span>Connection pooled & 32 PSL operations executed</span>
        </div>
      </Card>

      {/* Anti-Hallucination Strategy Card */}
      <Card className="p-6 border-border bg-card shadow-xs space-y-4 gap-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <ShieldCheck className="w-4 h-4 text-brand-cyan" />
            <span>Truth Guarantee</span>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-mono bg-brand-pink/10 text-brand-pink border-brand-pink/30 dark:bg-brand-cyan/10 dark:text-brand-cyan dark:border-brand-cyan/40 font-semibold px-2 py-0.5"
          >
            2-Layer Check
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Deterministic evidence validator blocks unverified claims before a resume is finalized:
        </p>

        <ul className="space-y-2 text-sm text-foreground">
          {[
            'Strict source ID mapping for all bullets',
            'Zero-tolerance for NOT_LEARNED skills',
            'Numeric claims extraction & review flags',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-pink dark:text-brand-cyan shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
