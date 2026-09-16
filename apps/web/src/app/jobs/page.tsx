'use client';

import { AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobs } from '@/hooks/usePramanApi';
import { JobCard, JobsEmptyState } from './_components/JobCard';

export default function JobsListPage() {
  const { data: jds = [], isLoading: loading, isFetching, error: fetchError, refetch } = useJobs();
  const error = fetchError ? (fetchError as Error).message : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Job Pipeline Inspector
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-xs text-brand-pink bg-brand-pink/10 border-brand-pink/30 dark:bg-muted dark:text-muted-foreground dark:border-border px-2.5 py-0.5"
            >
              {jds.length} jobs
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed max-w-2xl">
            Analyze target job descriptions, evaluate truthful candidate alignment, and generate
            audit-verified resumes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-foreground border-border bg-card hover:bg-muted hover:border-brand-pink/40 hover:text-brand-pink dark:hover:border-border dark:hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link
            href="/jobs/new"
            className={buttonVariants({
              size: 'sm',
              className:
                'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-medium shadow-sm shadow-brand-cyan/20',
            })}
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Job Analysis</span>
          </Link>
        </div>
      </div>

      {/* Error state with retry */}
      {error && (
        <Alert
          variant="destructive"
          className="mb-6 flex items-center justify-between border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-pink shrink-0" />
            <AlertDescription className="text-xs text-brand-pink">{error}</AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs border-brand-pink/40 text-brand-pink hover:bg-brand-pink/20 hover:text-brand-light shrink-0"
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Loading state: Zero-CLS Skeleton cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border bg-card/60 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-56 bg-muted" />
                  <Skeleton className="h-4 w-36 bg-muted/60" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-muted" />
              </div>
              <Skeleton className="h-4 w-full bg-muted/40" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16 rounded bg-muted/50" />
                <Skeleton className="h-5 w-20 rounded bg-muted/50" />
                <Skeleton className="h-5 w-24 rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      ) : jds.length === 0 ? (
        <JobsEmptyState />
      ) : (
        <div className="space-y-4">
          {jds.map((jd) => (
            <JobCard key={jd.id} jd={jd} />
          ))}
        </div>
      )}
    </div>
  );
}
