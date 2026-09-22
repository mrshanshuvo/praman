import type {
  ApplicationNote,
  ApplicationTracker,
  CreateMilestoneDto,
  CreateNoteDto,
  InterviewMilestone,
  UpdateApplicationTrackerDto,
  UpdateMilestoneDto,
  UpdateNoteDto,
} from '@praman/schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetcher } from '@/lib/api-client';

export function useUpdateTrackerDossier(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplicationTrackerDto) =>
      fetcher<ApplicationTracker>(`${API_URL}/job-descriptions/${jobId}/tracker/dossier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
    },
  });
}
