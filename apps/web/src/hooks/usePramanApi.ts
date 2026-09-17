'use client';

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
    throw new Error(message);
  }

  return res.json();
}

// ==========================================
// Job Descriptions Queries & Mutations
// ==========================================

export function useJobs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => fetcher<any[]>(`${API_URL}/job-descriptions`),
    enabled: options?.enabled ?? true,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => fetcher<any>(`${API_URL}/job-descriptions/${id}`),
    enabled: Boolean(id),
  });
}

export function useJobResume(id: string) {
  return useQuery({
    queryKey: ['jobs', id, 'resume'],
    queryFn: () => fetcher<any>(`${API_URL}/job-descriptions/${id}/resume`),
    enabled: Boolean(id),
  });
}

export function useJobResumeLatex(id: string) {
  return useQuery({
    queryKey: ['jobs', id, 'resume', 'latex'],
    queryFn: () => fetcher<{ latex: string }>(`${API_URL}/job-descriptions/${id}/resume/latex`),
    enabled: Boolean(id),
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rawText: string; title?: string; company?: string }) =>
      fetcher<any>(`${API_URL}/job-descriptions`, {
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
    queryFn: () => fetcher<any>(`${API_URL}/candidate-profile`),
    enabled: options?.enabled ?? true,
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });

  const updatePersonal = useMutation({
    mutationFn: (personal: any) =>
      fetcher(`${API_URL}/candidate-profile/personal`, {
        method: 'PUT',
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
