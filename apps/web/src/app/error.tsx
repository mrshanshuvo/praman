'use client';

import { AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error in Praman application:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-pink/10 border border-brand-pink/30 text-brand-pink shadow-lg shadow-brand-pink/5">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 text-xs font-mono font-bold text-destructive uppercase tracking-widest">
            Application Error
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Something went wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error was encountered while processing your truth-verified pipeline data.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-foreground/60 bg-muted/40 py-1 px-2 rounded-md inline-block">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="sm"
            onClick={() => reset()}
            className="w-full sm:w-auto bg-brand-pink hover:bg-brand-pink/90 text-white font-semibold gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>

          <Link
            href="/jobs"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className:
                'w-full sm:w-auto border-border bg-card hover:bg-muted text-foreground gap-1.5',
            })}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Return to Pipeline</span>
          </Link>
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
