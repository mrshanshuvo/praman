'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl bg-muted shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-52 bg-muted" />
            <Skeleton className="h-4 w-40 bg-muted/60" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 border-b border-border pb-3 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-5 w-24 rounded bg-muted/60 shrink-0" />
        ))}
      </div>
    </div>
  );
}
