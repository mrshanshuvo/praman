import type {
  BatchImportProfileRequest,
  CandidateProfile,
  CreateCertificationDto,
  CreateEducationDto,
  CreateExperienceDto,
  CreateProjectDto,
  CreateSkillDto,
  ParsedResumeData,
  UpdateCandidatePersonal,
} from '@praman/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL, fetcher } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export function useCandidateProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.candidate.profile(),
    queryFn: () => fetcher<CandidateProfile>(`${API_URL}/candidate-profile`),
    enabled: options?.enabled ?? true,
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.candidate.all });

  const updatePersonal = useMutation({
    mutationFn: (personal: UpdateCandidatePersonal) =>
      fetcher(`${API_URL}/candidate-profile/personal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personal),
      }),
    onSuccess: invalidate,
  });

  const addExperience = useMutation({
    mutationFn: (data: CreateExperienceDto) =>
      fetcher(`${API_URL}/candidate-profile/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateExperience = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExperienceDto> }) =>
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
    mutationFn: (data: CreateProjectDto) =>
      fetcher(`${API_URL}/candidate-profile/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProjectDto> }) =>
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
    mutationFn: (data: CreateSkillDto) =>
      fetcher(`${API_URL}/candidate-profile/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateSkill = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSkillDto> }) =>
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
    mutationFn: (data: CreateEducationDto) =>
      fetcher(`${API_URL}/candidate-profile/educations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateEducation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEducationDto> }) =>
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
    mutationFn: (data: CreateCertificationDto) =>
      fetcher(`${API_URL}/candidate-profile/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });

  const updateCertification = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCertificationDto> }) =>
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
      queryClient.invalidateQueries({ queryKey: queryKeys.candidate.all });
    },
  });
}
