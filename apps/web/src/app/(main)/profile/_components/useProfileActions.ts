import { toast } from 'sonner';
import type { useProfileMutations } from '@/hooks/usePramanApi';

type ProfileMutations = ReturnType<typeof useProfileMutations>;

export function useProfileActions(muts: ProfileMutations) {
  const runMutation = async (action: () => Promise<any>, successMsg: string) => {
    try {
      await action();
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const confirmDelete = async (msg: string, action: () => Promise<any>, successMsg: string) => {
    if (!confirm(msg)) return;
    await runMutation(action, successMsg);
  };

  return {
    handleUpdatePersonal: (data: any) =>
      runMutation(
        () => muts.updatePersonal.mutateAsync(data),
        'Personal details updated successfully',
      ),
    handleAddExp: (data: any) =>
      runMutation(() => muts.addExperience.mutateAsync(data), 'Experience record added'),
    handleUpdateExp: (id: string, data: any) =>
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
    handleAddProj: (data: any) =>
      runMutation(() => muts.addProject.mutateAsync(data), 'Project added successfully'),
    handleUpdateProj: (id: string, data: any) =>
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
    handleAddSk: (data: any) =>
      runMutation(() => muts.addSkill.mutateAsync(data), `Skill "${data.name}" added`),
    handleUpdateSk: (id: string, data: any) =>
      runMutation(() => muts.updateSkill.mutateAsync({ id, data }), `Skill "${data.name}" updated`),
    handleDeleteSk: (id: string, name: string) =>
      confirmDelete(
        `Remove skill "${name}"?`,
        () => muts.deleteSkill.mutateAsync(id),
        `Removed skill "${name}"`,
      ),
  };
}
