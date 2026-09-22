'use client';

import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex items-center justify-center bg-background text-foreground p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-pink/10 border border-brand-pink/30 text-brand-pink">
            <AlertOctagon className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              Critical System Error
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A critical layout exception occurred. Please reload the workspace.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground/60">Digest: {error.digest}</p>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => reset()}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Application</span>
          </Button>
        </div>
      </body>
    </html>
  );
}
