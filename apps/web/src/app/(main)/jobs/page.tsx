'use client';

import { calculateMatchScore } from '@praman/schemas';
import { AlertCircle, ArrowUpDown, Filter, PlusCircle, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobs } from '@/hooks/usePramanApi';
import { JobCard, JobsEmptyState } from './_components/JobCard';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Jobs' },
  { key: 'SAVED', label: 'Saved' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'INTERVIEWING', label: 'Interviewing' },
  { key: 'OFFER', label: 'Offer' },
  { key: 'REJECTED', label: 'Rejected' },
];

function getJobMatchScore(jd: any): number {
  if (jd.analysis?.matchScore != null) {
    return jd.analysis.matchScore;
  }
  if (jd.analysis?.result) {
    return calculateMatchScore(jd.analysis.result).score;
  }
  return -1;
}

export default function JobsListPage() {
  const { data: jds = [], isLoading: loading, isFetching, error: fetchError, refetch } = useJobs();
  const error = fetchError ? (fetchError as Error).message : null;

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

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
        const matchesStatus = statusFilter === 'ALL' || (jd.status || 'SAVED') === statusFilter;
        const title = jd.structured?.jobTitle?.toLowerCase() || '';
        const text = jd.rawText?.toLowerCase() || '';
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || title.includes(query) || text.includes(query);
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
  }, [jds, statusFilter, sortBy, searchQuery]);

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

      {/* Filter & Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-cyan"
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
            }}
            className="mt-3 text-xs text-brand-cyan"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedJds.map((jd) => (
            <JobCard key={jd.id} jd={jd} />
          ))}
        </div>
      )}
    </div>
  );
}
