import type {
  CandidateProfile,
  JobDescriptionRecord,
  ResumeRecord,
  ResumeVersionSummary,
} from '@praman/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'praman_auth_token';
const REFRESH_TOKEN_KEY = 'praman_refresh_token';

async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Automatically inject Bearer token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let res = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, attempt a single silent refresh
  if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem(TOKEN_KEY, newAccessToken);
        const isSecure = window.location.protocol === 'https:';
        // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
        document.cookie = `${TOKEN_KEY}=${encodeURIComponent(newAccessToken)}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Retry original request with newly issued access token
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        res = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
        document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
    } catch {
      // Network error during refresh
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = Array.isArray(errorBody.message)
      ? errorBody.message.join(', ')
      : errorBody.message || `Request failed with status ${res.status}`;
    const err = new Error(message) as Error & { status?: number; data?: any };
    err.status = res.status;
    err.data = errorBody;
    throw err;
  }

  return res.json();
}

// ==========================================
// Job Descriptions Queries & Mutations
// ==========================================

export function useJobs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => fetcher<JobDescriptionRecord[]>(`${API_URL}/job-descriptions`),
    enabled: options?.enabled ?? true,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => fetcher<JobDescriptionRecord>(`${API_URL}/job-descriptions/${id}`),
    enabled: Boolean(id),
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
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetcher<any>(`${API_URL}/job-descriptions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.id] });
    },
  });
}

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
    queryFn: () => fetcher<ResumeVersionSummary[]>(`${API_URL}/job-descriptions/${id}/resume/versions`),
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
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useRunStage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stage: 'match' | 'strategy' | 'resume') =>
      fetcher<any>(`${API_URL}/job-descriptions/${id}/${stage}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs', id, 'resume'] });
    },
  });
}

export function useRunFullPipeline(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher<any>(`${API_URL}/job-descriptions/${id}/run-pipeline`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs', id, 'resume'] });
    },
  });
}

// ==========================================
// Candidate Profile Queries & Mutations
// ==========================================

export function useCandidateProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => fetcher<CandidateProfile>(`${API_URL}/candidate-profile`),
    enabled: options?.enabled ?? true,
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });

  const updatePersonal = useMutation({
    mutationFn: (personal: any) =>
      fetcher(`${API_URL}/candidate-profile/personal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personal),
      }),
    onSuccess: invalidate,
  });

  const addExperience = useMutation({
    mutationFn: (data: any) =>
      fetcher(`${API_URL}/candidate-profile/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateExperience = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetcher(`${API_URL}/candidate-profile/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const deleteExperience = useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/candidate-profile/experiences/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });

  const addProject = useMutation({
    mutationFn: (data: any) =>
      fetcher(`${API_URL}/candidate-profile/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetcher(`${API_URL}/candidate-profile/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/candidate-profile/projects/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });

  const addSkill = useMutation({
    mutationFn: (data: any) =>
      fetcher(`${API_URL}/candidate-profile/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateSkill = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetcher(`${API_URL}/candidate-profile/skills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const deleteSkill = useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/candidate-profile/skills/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });

  const addEducation = useMutation({
    mutationFn: (data: any) =>
      fetcher(`${API_URL}/candidate-profile/educations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateEducation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetcher(`${API_URL}/candidate-profile/educations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const deleteEducation = useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/candidate-profile/educations/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });

  const addCertification = useMutation({
    mutationFn: (data: any) =>
      fetcher(`${API_URL}/candidate-profile/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateCertification = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetcher(`${API_URL}/candidate-profile/certifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const deleteCertification = useMutation({
    mutationFn: (id: string) =>
      fetcher(`${API_URL}/candidate-profile/certifications/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: invalidate,
  });

  return {
    updatePersonal,
    addExperience,
    updateExperience,
    deleteExperience,
    addProject,
    updateProject,
    deleteProject,
    addSkill,
    updateSkill,
    deleteSkill,
    addEducation,
    updateEducation,
    deleteEducation,
    addCertification,
    updateCertification,
    deleteCertification,
  };
}
