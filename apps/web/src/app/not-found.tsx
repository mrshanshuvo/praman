'use client';

import { ArrowLeft, Compass, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan shadow-lg shadow-brand-cyan/5">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
            Error 404
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Page Not Found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The truth-verified document, pipeline, or route you are searching for does not exist or
            has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/jobs"
            className={buttonVariants({
              size: 'sm',
              className:
                'w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold gap-1.5 shadow-sm',
            })}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Go to Pipeline</span>
          </Link>

          <Link
            href="/profile"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'w-full sm:w-auto border-border bg-card hover:bg-muted text-foreground gap-1.5',
            })}
          >
            <User className="w-3.5 h-3.5" />
            <span>Candidate Profile</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </Button>
        </div>

        <div className="pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground/60 font-mono">
            Praman • Truth-Preserving Evidence Ledger
          </p>
        </div>
      </div>
    </div>
  );
}
