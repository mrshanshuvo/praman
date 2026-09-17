'use client';

import { ArrowRight, PlusCircle, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface HeroSectionProps {
  jdCount: number;
  isAuthenticated?: boolean;
}

export function HeroSection({ jdCount, isAuthenticated = false }: HeroSectionProps) {
  return (
    <Card className="relative overflow-hidden rounded-3xl border-border bg-card p-8 sm:p-12 shadow-md gap-0">
      <div className="max-w-3xl space-y-4">
        <Badge
          variant="outline"
          className="gap-2 px-3 py-1 rounded-full bg-brand-pink/10 border-brand-pink/30 text-brand-pink dark:bg-brand-cyan/10 dark:border-brand-cyan/40 dark:text-brand-cyan text-xs font-mono font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-brand-pink dark:text-brand-cyan" />
          <span>PRISMA 8 PSL • ZERO-HALLUCINATION RESUME PIPELINE</span>
        </Badge>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          Verifiable, Truth-Preserved <br className="hidden sm:inline" />
          <span className="text-brand-pink dark:text-brand-cyan">AI Resume Generation</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
          Praman replaces generic prompt engineering with a 4-stage deterministic pipeline. Every
          resume bullet, skill, and claim is strictly cross-referenced against confirmed candidate
          records.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/jobs/new"
                className={buttonVariants({
                  size: 'lg',
                  className:
                    'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-sm gap-2',
                })}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Paste JD & Run Pipeline</span>
              </Link>

              <Link
                href="/profile"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className:
                    'border-border hover:border-brand-pink/60 bg-card hover:bg-brand-pink/10 text-foreground font-semibold gap-2 transition-all',
                })}
              >
                <User className="w-4 h-4 text-brand-pink" />
                <span>Candidate Profile</span>
              </Link>

              <Link
                href="/jobs"
                className={buttonVariants({
                  variant: 'ghost',
                  size: 'lg',
                  className:
                    'text-muted-foreground hover:text-brand-pink dark:hover:text-foreground gap-2',
                })}
              >
                <span>View Past JDs ({jdCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className={buttonVariants({
                  size: 'lg',
                  className:
                    'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-sm gap-2',
                })}
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className:
                    'border-border hover:border-brand-cyan/60 bg-card hover:bg-brand-cyan/10 text-foreground font-semibold gap-2 transition-all',
                })}
              >
                <User className="w-4 h-4 text-brand-cyan" />
                <span>Sign In / Demo</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
