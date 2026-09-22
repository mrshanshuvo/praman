import type {
  CreateExperienceDto,
  CreateProjectDto,
  CreateSkillDto,
  UpdateCandidatePersonal,
} from '@praman/schemas';
import { toast } from 'sonner';
import type { useProfileMutations } from '@/hooks/usePramanApi';

type ProfileMutations = ReturnType<typeof useProfileMutations>;

export function useProfileActions(muts: ProfileMutations) {
  const runMutation = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      toast.success(successMsg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    }
  };

  const confirmDelete = async (msg: string, action: () => Promise<unknown>, successMsg: string) => {
    if (!confirm(msg)) return;
    await runMutation(action, successMsg);
  };

  return {
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
    handleDeleteExp: (id: string, company: string) =>
      confirmDelete(
        `Delete experience at ${company}?`,
        () => muts.deleteExperience.mutateAsync(id),
        'Experience record deleted',
      ),
    handleAddProj: (data: CreateProjectDto) =>
      runMutation(() => muts.addProject.mutateAsync(data), 'Project added successfully'),
    handleUpdateProj: (id: string, data: Partial<CreateProjectDto>) =>
      runMutation(
        () => muts.updateProject.mutateAsync({ id, data }),
        'Project updated successfully',
      ),
    handleDeleteProj: (id: string, name: string) =>
      confirmDelete(
        `Delete project "${name}"?`,
        () => muts.deleteProject.mutateAsync(id),
        'Project removed',
      ),
    handleAddSk: (data: CreateSkillDto) =>
      runMutation(() => muts.addSkill.mutateAsync(data), `Skill "${data.name}" added`),
    handleUpdateSk: (id: string, data: Partial<CreateSkillDto>) =>
      runMutation(
        () => muts.updateSkill.mutateAsync({ id, data }),
        data.name ? `Skill "${data.name}" updated` : 'Skill updated',
      ),
    handleDeleteSk: (id: string, name: string) =>
      confirmDelete(
        `Remove skill "${name}"?`,
        () => muts.deleteSkill.mutateAsync(id),
        `Removed skill "${name}"`,
      ),
  };
}
