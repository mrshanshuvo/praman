import type {
  ApplicationNote,
  ApplicationTracker,
  CreateMilestoneDto,
  CreateNoteDto,
  InterviewMilestone,
  JobDescriptionRecord,
  UpdateApplicationTrackerDto,
  UpdateMilestoneDto,
  UpdateNoteDto,
} from '@praman/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { API_URL, fetcher } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

function ensureTracker(tracker?: ApplicationTracker | null): ApplicationTracker {
  return {
    appliedDate: tracker?.appliedDate ?? null,
    portalUrl: tracker?.portalUrl ?? null,
    targetSalary: tracker?.targetSalary ?? null,
    referralContact: tracker?.referralContact ?? null,
    milestones: tracker?.milestones ? [...tracker.milestones] : [],
    notes: tracker?.notes ? [...tracker.notes] : [],
  };
}

export function useUpdateTrackerDossier(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplicationTrackerDto) =>
      fetcher<ApplicationTracker>(`${API_URL}/job-descriptions/${jobId}/tracker/dossier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(
        queryKeys.jobs.detail(jobId),
      );

      if (previousJob) {
        const tracker = ensureTracker(previousJob.tracker);
        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(jobId), {
          ...previousJob,
          tracker: {
            ...tracker,
            ...data,
          },
        });
      }

      return { previousJob };
    },
    onError: (err: Error, _, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
      }
      toast.error(err?.message || 'Failed to update application dossier.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
  });
}

export function useAddMilestone(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMilestoneDto) =>
      fetcher<InterviewMilestone>(`${API_URL}/job-descriptions/${jobId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(
        queryKeys.jobs.detail(jobId),
      );

      if (previousJob) {
        const tracker = ensureTracker(previousJob.tracker);
        const optimisticMilestone: InterviewMilestone = {
          id: `temp-${Date.now()}`,
          roundNumber: tracker.milestones.length + 1,
          stage: data.stage,
          title: data.title,
          scheduledAt: data.scheduledAt || null,
          timezone: data.timezone || null,
          status: data.status || 'SCHEDULED',
          interviewer: data.interviewer || null,
          meetingLink: data.meetingLink || null,
          notes: data.notes || null,
          questionsAsked: data.questionsAsked || [],
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(jobId), {
          ...previousJob,
          tracker: {
            ...tracker,
            milestones: [...tracker.milestones, optimisticMilestone],
          },
        });
      }

      return { previousJob };
    },
    onError: (err: Error, _, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
      }
      toast.error(err?.message || 'Failed to add interview milestone.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
  });
}

export function useUpdateMilestone(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: UpdateMilestoneDto }) =>
      fetcher<InterviewMilestone>(
        `${API_URL}/job-descriptions/${jobId}/milestones/${milestoneId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      ),
    onMutate: async ({ milestoneId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(
        queryKeys.jobs.detail(jobId),
      );

      if (previousJob) {
        const tracker = ensureTracker(previousJob.tracker);
        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(jobId), {
          ...previousJob,
          tracker: {
            ...tracker,
            milestones: tracker.milestones.map((m) =>
              m.id === milestoneId ? { ...m, ...data } : m,
            ),
          },
        });
      }

      return { previousJob };
    },
    onError: (err: Error, _, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
      }
      toast.error(err?.message || 'Failed to update interview milestone.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
  });
}

export function useDeleteMilestone(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      fetcher<{ success: boolean; milestoneId: string }>(
        `${API_URL}/job-descriptions/${jobId}/milestones/${milestoneId}`,
        {
          method: 'DELETE',
        },
      ),
    onMutate: async (milestoneId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(
        queryKeys.jobs.detail(jobId),
      );

      if (previousJob) {
        const tracker = ensureTracker(previousJob.tracker);
        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(jobId), {
          ...previousJob,
          tracker: {
            ...tracker,
            milestones: tracker.milestones.filter((m) => m.id !== milestoneId),
          },
        });
      }

      return { previousJob };
    },
    onError: (err: Error, _, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
      }
      toast.error(err?.message || 'Failed to delete interview milestone.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
  });
}

export function useAddJobNote(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNoteDto) =>
      fetcher<ApplicationNote>(`${API_URL}/job-descriptions/${jobId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(
        queryKeys.jobs.detail(jobId),
      );

      if (previousJob) {
        const tracker = ensureTracker(previousJob.tracker);
        const optimisticNote: ApplicationNote = {
          id: `temp-${Date.now()}`,
          content: data.content,
          tag: data.tag || 'GENERAL',
          isPinned: data.isPinned ?? false,
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(jobId), {
          ...previousJob,
          tracker: {
            ...tracker,
            notes: [...tracker.notes, optimisticNote],
          },
        });
      }

      return { previousJob };
    },
    onError: (err: Error, _, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
      }
      toast.error(err?.message || 'Failed to add note.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}

export function useUpdateJobNote(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: UpdateNoteDto }) =>
      fetcher<ApplicationNote>(`${API_URL}/job-descriptions/${jobId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onMutate: async ({ noteId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(
        queryKeys.jobs.detail(jobId),
      );

      if (previousJob) {
        const tracker = ensureTracker(previousJob.tracker);
        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(jobId), {
          ...previousJob,
          tracker: {
            ...tracker,
            notes: tracker.notes.map((n) => (n.id === noteId ? { ...n, ...data } : n)),
          },
        });
      }

      return { previousJob };
    },
    onError: (err: Error, _, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
      }
      toast.error(err?.message || 'Failed to update note.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}

export function useDeleteJobNote(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) =>
      fetcher<{ success: boolean; noteId: string }>(
        `${API_URL}/job-descriptions/${jobId}/notes/${noteId}`,
        {
          method: 'DELETE',
        },
      ),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      const previousJob = queryClient.getQueryData<JobDescriptionRecord>(
        queryKeys.jobs.detail(jobId),
      );

      if (previousJob) {
        const tracker = ensureTracker(previousJob.tracker);
        queryClient.setQueryData<JobDescriptionRecord>(queryKeys.jobs.detail(jobId), {
          ...previousJob,
          tracker: {
            ...tracker,
            notes: tracker.notes.filter((n) => n.id !== noteId),
          },
        });
      }

      return { previousJob };
    },
    onError: (err: Error, _, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(queryKeys.jobs.detail(jobId), context.previousJob);
      }
      toast.error(err?.message || 'Failed to delete note.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
  });
}
