import type {
  ApplicationStatus,
  JobDescriptionRecord,
  JobTelemetrySummary,
  PaginationMeta,
  UserAiUsageSummary,
} from '@praman/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { API_URL, fetcher } from '@/lib/api-client';
import { type JobFilterParams, queryKeys } from '@/lib/query-keys';

export interface UseJobsOptions extends JobFilterParams {
  enabled?: boolean;
}

export type PaginatedJobsList = JobDescriptionRecord[] & {
  items: JobDescriptionRecord[];
  meta: PaginationMeta;
};

export function useJobs(options?: UseJobsOptions) {
  const queryParams = new URLSearchParams();
  if (options?.page != null) queryParams.set('page', String(options.page));
  if (options?.limit != null) queryParams.set('limit', String(options.limit));
  if (options?.status && options.status !== 'ALL') queryParams.set('status', options.status);
  if (options?.q) queryParams.set('q', options.q);
  if (options?.sortBy) queryParams.set('sortBy', options.sortBy);
  if (options?.all) queryParams.set('all', 'true');

  const qs = queryParams.toString();
  const url = `${API_URL}/job-descriptions${qs ? `?${qs}` : ''}`;

  return useQuery<PaginatedJobsList>({
    queryKey: queryKeys.jobs.list({
      page: options?.page,
      limit: options?.limit,
      status: options?.status,
      q: options?.q,
      sortBy: options?.sortBy,
      all: options?.all,
    }),
    queryFn: async () => {
      const res = await fetcher<
        JobDescriptionRecord[] | { items: JobDescriptionRecord[]; meta: PaginationMeta }
      >(url);
      let items: JobDescriptionRecord[];
      let meta: PaginationMeta;

      if (Array.isArray(res)) {
        items = res;
        meta = {
          total: res.length,
          page: 1,
          limit: res.length || 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        };
      } else {
        items = res.items || [];
        meta = res.meta || {
          total: items.length,
          page: 1,
          limit: items.length || 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }

      return Object.assign([...items], { items, meta }) as PaginatedJobsList;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => fetcher<JobDescriptionRecord>(`${API_URL}/job-descriptions/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rawText: string; title?: string; company?: string; force?: boolean }) =>
      fetcher<JobDescriptionRecord>(`${API_URL}/job-descriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher<{ success: boolean; message: string }>(`${API_URL}/job-descriptions/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}

export type JobListData =
  | { items: JobDescriptionRecord[]; meta?: PaginationMeta }
  | JobDescriptionRecord[];

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus | string }) =>
      fetcher<JobDescriptionRecord>(`${API_URL}/job-descriptions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ id, status }) => {
      const appStatus = status as ApplicationStatus;
      // 1. Cancel in-flight queries so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(id) });

      // 2. Snapshot current cache data for rollback
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(id));
      const previousLists = queryClient.getQueriesData<JobListData>({
        queryKey: queryKeys.jobs.lists(),
      });

      // 3. Optimistically update single job detail query
      if (previousJob) {
        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(id), {
          ...previousJob,
          status: appStatus,
        });
      }

      // 4. Optimistically update all job lists
      queryClient.setQueriesData<JobListData>({ queryKey: queryKeys.jobs.lists() }, (oldData) => {
        if (!oldData) return oldData;

        if ('items' in oldData && Array.isArray(oldData.items)) {
          return {
            ...oldData,
            items: oldData.items.map((job) =>
              job.id === id ? { ...job, status: appStatus } : job,
            ),
          };
        }

        if (Array.isArray(oldData)) {
          return oldData.map((job) => (job.id === id ? { ...job, status: appStatus } : job));
        }

        return oldData;
      });

      return { previousJob, previousLists, id };
    },
    onError: (err: Error, _, context) => {
      // 5. Rollback cache on error
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(context.id), context.previousJob);
      }
      if (context?.previousLists) {
        for (const [queryKey, data] of context.previousLists) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(err?.message || 'Failed to update job status. Reverted change.');
    },
    onSettled: (_, __, variables) => {
      // 6. Resync with backend
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(variables.id) });
    },
  });
}

export function useRunStage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stage: 'match' | 'strategy' | 'resume') =>
      fetcher<unknown>(`${API_URL}/job-descriptions/${id}/${stage}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
    },
  });
}

export function useRunFullPipeline(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher<{ success: boolean; message?: string }>(
        `${API_URL}/job-descriptions/${id}/run-pipeline`,
        {
          method: 'POST',
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
    },
  });
}

export function useJobTelemetry(id: string) {
  return useQuery({
    queryKey: queryKeys.jobs.telemetry(id),
    queryFn: () => fetcher<JobTelemetrySummary>(`${API_URL}/job-descriptions/${id}/telemetry`),
    enabled: Boolean(id),
  });
}

export function useUserAiUsage(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.ai.usage(),
    queryFn: () => fetcher<UserAiUsageSummary>(`${API_URL}/job-descriptions/telemetry/usage`),
    enabled: options?.enabled ?? true,
  });
}
