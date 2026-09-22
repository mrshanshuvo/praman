import type {
  ApplicationNote,
  ApplicationTracker,
  BatchImportProfileRequest,
  CandidateProfile,
  CreateMilestoneDto,
  CreateNoteDto,
  InterviewMilestone,
  JobDescriptionRecord,
  PaginationMeta,
  ParsedResumeData,
  ResumeRecord,
  ResumeVersionSummary,
  UpdateApplicationTrackerDto,
  UpdateMilestoneDto,
  UpdateNoteDto,
} from '@praman/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'praman_auth_token';
const REFRESH_TOKEN_KEY = 'praman_refresh_token';

let activeRefreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const storedRefreshToken =
        typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
      });

      if (!refreshRes.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
          document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            const loginUrl = new URL('/login', window.location.origin);
            loginUrl.searchParams.set('from', currentPath + window.location.search);
            window.location.replace(loginUrl.href);
          }
        }
        return null;
      }

      const data = await refreshRes.json();
      const newAccessToken: string = data.accessToken;
      const newRefreshToken: string | undefined = data.refreshToken;

      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, newAccessToken);
        const isSecure = window.location.protocol === 'https:';
        // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
        document.cookie = `${TOKEN_KEY}=${encodeURIComponent(newAccessToken)}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        if (newRefreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }
      }

      return newAccessToken;
    } catch {
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

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

  // If 401 Unauthorized, attempt deduplicated silent refresh
  if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      res = await fetch(url, {
        ...options,
        headers,
      });
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

export interface UseJobsOptions {
  enabled?: boolean;
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  sortBy?: string;
  all?: boolean;
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
    queryKey: [
      'jobs',
      options?.page,
      options?.limit,
      options?.status,
      options?.q,
      options?.sortBy,
      options?.all,
    ],
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

export function getResumePdfUrl(id: string, templateId?: string, versionOrId?: string) {
  const queryParams = new URLSearchParams();
  if (templateId) queryParams.set('template', templateId);
  if (versionOrId) queryParams.set('version', versionOrId);
  const qs = queryParams.toString();
  return `${API_URL}/job-descriptions/${id}/resume/pdf${qs ? `?${qs}` : ''}`;
}

export async function fetchResumePdfBlob(
  id: string,
  templateId?: string,
  versionOrId?: string,
): Promise<Blob> {
  const url = getResumePdfUrl(id, templateId, versionOrId);
  const headers = new Headers();

  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem('praman_auth_token') ||
      localStorage.getItem('praman_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response = await fetch(url, { headers });

  // If 401 Unauthorized, attempt deduplicated silent refresh
  if (response.status === 401 && typeof window !== 'undefined') {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(url, { headers });
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }

  return response.blob();
}

export async function downloadResumePdf(
  id: string,
  templateId?: string,
  versionOrId?: string,
  filename?: string,
) {
  const blob = await fetchResumePdfBlob(id, templateId, versionOrId);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `resume_${templateId || 'modern-developer'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
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

  const parseResume = useMutation({
    mutationFn: (data: { rawText: string }) =>
      fetcher<ParsedResumeData>(`${API_URL}/candidate-profile/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  });

  const importProfile = useMutation({
    mutationFn: (data: BatchImportProfileRequest) =>
      fetcher<CandidateProfile>(`${API_URL}/candidate-profile/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    parseResume,
    importProfile,
  };
}

export function useParseResume() {
  return useMutation({
    mutationFn: (data: { rawText: string }) =>
      fetcher<ParsedResumeData>(`${API_URL}/candidate-profile/parse-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  });
}

export function useImportProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BatchImportProfileRequest) =>
      fetcher<CandidateProfile>(`${API_URL}/candidate-profile/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
    },
  });
}
