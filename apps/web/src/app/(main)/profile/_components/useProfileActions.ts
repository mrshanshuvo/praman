'use client';

import type {
  CreateExperienceDto,
  CreateProjectDto,
  CreateSkillDto,
  UpdateCandidatePersonal,
} from '@praman/schemas';
import { useState } from 'react';
import { toast } from 'sonner';
import type { useProfileMutations } from '@/hooks/usePramanApi';

type ProfileMutations = ReturnType<typeof useProfileMutations>;

export interface PendingDeleteState {
  title: string;
  itemTitle: string;
  action: () => Promise<unknown>;
  successMsg: string;
}

export function useProfileActions(muts: ProfileMutations) {
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const runMutation = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      toast.success(successMsg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    }
  };

  const requestDelete = (
    title: string,
    itemTitle: string,
    action: () => Promise<unknown>,
    successMsg: string,
  ) => {
    setPendingDelete({
      title,
      itemTitle,
      action,
      successMsg,
    });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await pendingDelete.action();
      toast.success(pendingDelete.successMsg);
      setPendingDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    pendingDelete,
    setPendingDelete,
    isDeleting,
    handleConfirmDelete,
    handleUpdatePersonal: (data: UpdateCandidatePersonal) =>
      runMutation(
        () => muts.updatePersonal.mutateAsync(data),
        'Personal details updated successfully',
      ),
    handleAddExp: (data: CreateExperienceDto) =>
      runMutation(() => muts.addExperience.mutateAsync(data), 'Experience record added'),
    handleUpdateExp: (id: string, data: Partial<CreateExperienceDto>) =>
      runMutation(
        () => muts.updateExperience.mutateAsync({ id, data }),
        'Experience record updated',
      ),
    handleDeleteExp: async (id: string, company: string) => {
      requestDelete(
        'Delete Experience Record',
        company,
        () => muts.deleteExperience.mutateAsync(id),
        'Experience record deleted',
      );
    },
    handleAddProj: (data: CreateProjectDto) =>
      runMutation(() => muts.addProject.mutateAsync(data), 'Project added successfully'),
    handleUpdateProj: (id: string, data: Partial<CreateProjectDto>) =>
      runMutation(
        () => muts.updateProject.mutateAsync({ id, data }),
        'Project updated successfully',
      ),
    handleDeleteProj: async (id: string, name: string) => {
      requestDelete(
        'Delete Project Record',
        name,
        () => muts.deleteProject.mutateAsync(id),
        'Project removed',
      );
    },
    handleAddSk: (data: CreateSkillDto) =>
      runMutation(() => muts.addSkill.mutateAsync(data), `Skill "${data.name}" added`),
    handleUpdateSk: (id: string, data: Partial<CreateSkillDto>) =>
      runMutation(
        () => muts.updateSkill.mutateAsync({ id, data }),
        data.name ? `Skill "${data.name}" updated` : 'Skill updated',
      ),
    handleDeleteSk: async (id: string, name: string) => {
      requestDelete(
        'Remove Skill',
        name,
        () => muts.deleteSkill.mutateAsync(id),
        `Removed skill "${name}"`,
      );
    },
  };
}
