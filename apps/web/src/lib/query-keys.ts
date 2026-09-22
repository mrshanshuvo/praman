/**
 * Centralized TanStack Query Key Factory
 * Provides hierarchical, strongly-typed query keys for deterministic cache
 * lookup, subscription, and granular invalidation.
 */

export interface JobFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  sortBy?: string;
  all?: boolean;
}

export const queryKeys = {
  jobs: {
    all: ['jobs'] as const,
    lists: () => [...queryKeys.jobs.all, 'list'] as const,
    list: (filters?: JobFilterParams) => [...queryKeys.jobs.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    tracker: (id: string) => [...queryKeys.jobs.detail(id), 'tracker'] as const,
    resumes: (id: string) => [...queryKeys.jobs.detail(id), 'resume'] as const,
    resume: (id: string, versionOrId?: string) =>
      [...queryKeys.jobs.resumes(id), versionOrId || 'latest'] as const,
    resumeVersions: (id: string) => [...queryKeys.jobs.resumes(id), 'versions'] as const,
    resumeLatex: (id: string, templateId?: string, versionOrId?: string) =>
      [
        ...queryKeys.jobs.resumes(id),
        'latex',
        templateId || 'default',
        versionOrId || 'latest',
      ] as const,
    outreach: (id: string) => [...queryKeys.jobs.detail(id), 'outreach'] as const,
    telemetry: (id: string) => [...queryKeys.jobs.detail(id), 'telemetry'] as const,
  },
  ai: {
    all: ['ai'] as const,
    usage: () => [...queryKeys.ai.all, 'usage'] as const,
  },
  candidate: {
    all: ['candidate'] as const,
    profile: () => [...queryKeys.candidate.all, 'profile'] as const,
  },
} as const;
