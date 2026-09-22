import type { ResumeRecord, ResumeVersionSummary } from '@praman/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  API_URL,
  downloadResumePdf,
  fetcher,
  fetchResumePdfBlob,
  getResumePdfUrl,
} from '@/lib/api-client';

export { downloadResumePdf, fetchResumePdfBlob, getResumePdfUrl };

export function useJobResume(id: string, versionOrId?: string) {
  return useQuery({
    queryKey: ['jobs', id, 'resume', versionOrId || 'latest'],
    queryFn: () =>
      fetcher<ResumeRecord>(
        `${API_URL}/job-descriptions/${id}/resume${versionOrId ? `?version=${encodeURIComponent(versionOrId)}` : ''}`,
      ),
    enabled: Boolean(id),
  });
}

export function useResumeVersions(id: string) {
  return useQuery({
    queryKey: ['jobs', id, 'resume', 'versions'],
    queryFn: () =>
      fetcher<ResumeVersionSummary[]>(`${API_URL}/job-descriptions/${id}/resume/versions`),
    enabled: Boolean(id),
  });
}

export function useJobResumeLatex(id: string, templateId?: string, versionOrId?: string) {
  const queryParams = new URLSearchParams();
  if (templateId) queryParams.set('template', templateId);
  if (versionOrId) queryParams.set('version', versionOrId);
  const qs = queryParams.toString();

  return useQuery({
    queryKey: [
      'jobs',
      id,
      'resume',
      'latex',
      templateId || 'modern-developer',
      versionOrId || 'latest',
    ],
    queryFn: () =>
      fetcher<{ latex: string; templateId?: string }>(
        `${API_URL}/job-descriptions/${id}/resume/latex${qs ? `?${qs}` : ''}`,
      ),
    enabled: Boolean(id),
  });
}

export function useUpdateResumeLatex(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: string | { latex: string; templateId?: string; version?: string }) => {
      const latex = typeof payload === 'string' ? payload : payload.latex;
      const templateId = typeof payload === 'string' ? undefined : payload.templateId;
      const version = typeof payload === 'string' ? undefined : payload.version;
      const queryParams = new URLSearchParams();
      if (templateId) queryParams.set('template', templateId);
      if (version) queryParams.set('version', version);
      const qs = queryParams.toString();

      return fetcher<{ success: boolean; downloadUrl: string }>(
        `${API_URL}/job-descriptions/${id}/resume/latex${qs ? `?${qs}` : ''}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latex }),
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', id, 'resume'] });
    },
  });
}

export function useJobOutreach(id: string) {
  return useQuery({
    queryKey: ['jobs', id, 'outreach'],
    queryFn: () =>
      fetcher<{
        coverLetter: any | null;
        coverLetterLatex: string | null;
        coverLetterValidation: { numberFlags: any[]; violations: string[] } | null;
        recruiterEmail: any | null;
      }>(`${API_URL}/job-descriptions/${id}/outreach`),
    enabled: Boolean(id),
  });
}

export function useGenerateCoverLetter(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher<{ coverLetter: any; coverLetterLatex: string }>(
        `${API_URL}/job-descriptions/${id}/outreach/cover-letter`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', id, 'outreach'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', id, 'resume'] });
    },
  });
}

export function useGenerateRecruiterEmail(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher<{ recruiterEmail: any }>(`${API_URL}/job-descriptions/${id}/outreach/email`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', id, 'outreach'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', id, 'resume'] });
    },
  });
}
