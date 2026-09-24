import { Skeleton } from '@/components/ui/skeleton';

export function SidebarSkeleton() {
  return (
    <aside className="hidden md:block shrink-0 h-screen w-64 border-r border-border bg-card/90 backdrop-blur-md sticky top-0 z-30 select-none">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg bg-muted/60" />
            <Skeleton className="h-5 w-24 rounded bg-muted/60" />
          </div>
          <Skeleton className="size-7 rounded-md bg-muted/40" />
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-4 px-2 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl">
              <Skeleton className="size-4 rounded bg-muted/60 shrink-0" />
              <Skeleton className="h-3.5 flex-1 rounded bg-muted/40" />
            </div>
          ))}

          {/* Recent Applications Header & Rows */}
          <div className="pt-6 px-1 space-y-2.5">
            <Skeleton className="h-2.5 w-28 rounded bg-muted/40 px-2" />
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-1.5 space-y-1.5">
                  <Skeleton className="h-3.5 w-4/5 rounded bg-muted/60" />
                  <Skeleton className="h-2.5 w-1/2 rounded bg-muted/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-border p-3 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-full bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4 rounded bg-muted/60" />
              <Skeleton className="h-2 w-1/2 rounded bg-muted/40" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
            <Skeleton className="h-5 w-16 rounded bg-muted/40" />
            <Skeleton className="h-6 w-16 rounded bg-muted/40" />
          </div>
        </div>
      </div>
    </aside>
  );
}
