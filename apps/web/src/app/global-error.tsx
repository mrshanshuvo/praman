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
      <body className="min-h-full flex items-center justify-center bg-[#090b10] text-[#f1f5f9] p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#ff2e63]/10 border border-[#ff2e63]/30 text-[#ff2e63]">
            <AlertOctagon className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
              Critical System Error
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              A critical layout exception occurred. Please reload the workspace.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-slate-500">Digest: {error.digest}</p>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => reset()}
            className="bg-[#08d9d6] hover:bg-[#08d9d6]/90 text-[#090b10] font-semibold gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Application</span>
          </Button>
        </div>
      </body>
    </html>
  );
}
