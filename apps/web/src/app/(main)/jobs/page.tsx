'use client';

import { calculateMatchScore, type JobDescriptionRecord } from '@praman/schemas';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  PlusCircle,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobs } from '@/hooks/usePramanApi';
import { useUrlQueryParam, useUrlTab } from '@/hooks/useUrlParams';
import { cn } from '@/lib/utils';
import { JobCard, JobsEmptyState, JobsKanbanBoard, JobsKanbanSkeleton } from './_components';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Jobs' },
  { key: 'SAVED', label: 'Saved' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'INTERVIEWING', label: 'Interviewing' },
  { key: 'OFFER', label: 'Offer' },
  { key: 'REJECTED', label: 'Rejected' },
] as const;

const VALID_STATUSES = STATUS_TABS.map((t) => t.key);

function getJobMatchScore(jd: JobDescriptionRecord): number {
  if (jd.analysis?.matchScore != null) {
    return jd.analysis.matchScore;
  }
  if (jd.analysis?.result) {
    return calculateMatchScore(jd.analysis.result).score;
  }
  return -1;
}

function JobsListSkeleton() {
  return (
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
  );
}

function JobsListContent() {
  const { data: rawJds, isLoading: loading, error: fetchError, refetch } = useJobs({ all: true });
  const error = fetchError ? (fetchError as Error).message : null;

  // Defensively normalize: API may return a raw array OR a paginated { items, meta } object
  const jds: JobDescriptionRecord[] = Array.isArray(rawJds)
    ? (rawJds as JobDescriptionRecord[])
    : Array.isArray((rawJds as unknown as { items?: JobDescriptionRecord[] })?.items)
      ? (rawJds as unknown as { items: JobDescriptionRecord[] }).items
      : [];

  const [viewMode = 'list', setViewMode] = useUrlQueryParam<'list' | 'board'>('view', 'list', {
    validValues: ['list', 'board'] as const,
  });

  const [statusFilter, setStatusFilter] = useUrlTab({
    paramName: 'status',
    defaultValue: 'ALL',
    validValues: VALID_STATUSES,
  });
  const [sortBy, setSortBy] = useUrlQueryParam<string>('sort', 'newest');
  const [searchQuery, setSearchQuery] = useUrlQueryParam<string>('q', '', { debounceMs: 250 });
  const [pageStr = '1', setPageStr] = useUrlQueryParam<string>('page', '1');
  const [limitStr = '10', setLimitStr] = useUrlQueryParam<string>('limit', '10');

  const currentPage = Math.max(1, Number.parseInt(pageStr, 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(limitStr, 10) || 10);
  const setCurrentPage = (p: number) => setPageStr(String(p));
  const setPageSize = (l: number) => setLimitStr(String(l));

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: jds.length };
    for (const jd of jds) {
      const s = jd.status || 'SAVED';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [jds]);

  const filteredAndSortedJds = useMemo(() => {
    return jds
      .filter((jd) => {
        const matchesStatus =
          viewMode === 'board' || statusFilter === 'ALL' || (jd.status || 'SAVED') === statusFilter;
        const title = jd.structured?.jobTitle?.toLowerCase() || '';
        const location = jd.structured?.locationOrWorkMode?.toLowerCase() || '';
        const text = jd.rawText?.toLowerCase() || '';
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query || title.includes(query) || location.includes(query) || text.includes(query);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_match') {
          return getJobMatchScore(b) - getJobMatchScore(a);
        }
        if (sortBy === 'lowest_match') {
          return getJobMatchScore(a) - getJobMatchScore(b);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // default: newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [jds, statusFilter, sortBy, searchQuery, viewMode]);

  const totalItems = filteredAndSortedJds.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, Number(currentPage) || 1), totalPages);

  const paginatedJds = useMemo(() => {
    if (viewMode === 'board') return filteredAndSortedJds;
    const startIndex = (validPage - 1) * pageSize;
    return filteredAndSortedJds.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedJds, validPage, pageSize, viewMode]);

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8">
      {/* Filter, Sort & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Status Tabs (List View) or Pipeline Helper (Board View) */}
        {viewMode === 'list' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {STATUS_TABS.map((tab) => {
              const count = statusCounts[tab.key] || 0;
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-foreground text-background shadow-xs'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-2xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-background/20 text-background'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Kanban View</span>
            <span className="text-muted-foreground/40">•</span>
            <span>Drag cards between columns or use the card menu to advance stages</span>
          </div>
        )}

        {/* Search, Sort & View Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search jobs or companies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 text-xs h-8 bg-card"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort jobs"
              className="text-xs bg-transparent text-foreground border-none outline-none cursor-pointer"
            >
              <option value="newest" className="bg-card text-foreground">
                Newest First
              </option>
              <option value="oldest" className="bg-card text-foreground">
                Oldest First
              </option>
              <option value="highest_match" className="bg-card text-foreground">
                Highest Match
              </option>
              <option value="lowest_match" className="bg-card text-foreground">
                Lowest Match
              </option>
            </select>
          </div>

          {/* View Mode Toggle: List vs Board */}
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                viewMode === 'list'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              aria-label="Board view"
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer',
                viewMode === 'board'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
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

      {/* Loading state: Zero-CLS Skeleton matching active view mode */}
      {loading ? (
        viewMode === 'board' ? (
          <JobsKanbanSkeleton />
        ) : (
          <JobsListSkeleton />
        )
      ) : jds.length === 0 ? (
        <JobsEmptyState />
      ) : filteredAndSortedJds.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/40">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No jobs matching your current filter criteria.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('ALL');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="mt-3 text-xs text-brand-cyan"
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'board' ? (
        <JobsKanbanBoard jobs={filteredAndSortedJds} />
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {paginatedJds.map((jd) => (
              <JobCard key={jd.id} jd={jd} />
            ))}
          </div>

          {/* List View Pagination Bar */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border mt-6">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Showing{' '}
                  <strong className="text-foreground">{(validPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="text-foreground">
                    {Math.min(validPage * pageSize, totalItems)}
                  </strong>{' '}
                  of <strong className="text-foreground">{totalItems}</strong> jobs
                </span>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Jobs per page"
                    className="bg-card border border-border rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, validPage - 1))}
                  disabled={validPage <= 1}
                  className="h-8 px-2.5 text-xs border-border bg-card hover:bg-muted text-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous</span>
                </Button>

                <span className="text-xs px-2 text-muted-foreground font-mono">
                  Page {validPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, validPage + 1))}
                  disabled={validPage >= totalPages}
                  className="h-8 px-2.5 text-xs border-border bg-card hover:bg-muted text-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StaticJobsPageSkeleton() {
  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-64 bg-muted/60" />
            <Skeleton className="h-5 w-16 rounded-full bg-muted/40" />
          </div>
          <Skeleton className="h-4 w-96 bg-muted/30" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-20 rounded-md bg-muted/40" />
          <Skeleton className="h-8 w-36 rounded-md bg-muted/60" />
        </div>
      </div>

      {/* Filter / Controls Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-56 rounded-lg bg-muted/40" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-44 rounded-lg bg-muted/40" />
          <Skeleton className="h-8 w-28 rounded-lg bg-muted/40" />
          <Skeleton className="h-8 w-28 rounded-lg bg-muted/40" />
        </div>
      </div>

      {/* Default List View Skeleton */}
      <JobsListSkeleton />
    </div>
  );
}

export default function JobsListPage() {
  return (
    <Suspense fallback={<StaticJobsPageSkeleton />}>
      <JobsListContent />
    </Suspense>
  );
}
