'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { useProfileMutations } from '@/hooks/usePramanApi';

type ProfileMutations = ReturnType<typeof useProfileMutations>;

export function useProfileActions(muts: ProfileMutations) {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const runMutation = async (action: () => Promise<any>, successMsg: string) => {
    try {
      await action();
      showMsg(successMsg);
    } catch (err: any) {
      showMsg(err.message || 'Operation failed', 'error');
    }
  };

  const confirmDelete = async (msg: string, action: () => Promise<any>, successMsg: string) => {
    if (!confirm(msg)) return;
    await runMutation(action, successMsg);
  };

  const notificationBanner = notification ? (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
        notification.type === 'success'
          ? 'bg-success/15 border-success/30 text-success'
          : 'bg-destructive/15 border-destructive/30 text-destructive'
      }`}
    >
      {notification.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
      )}
      <span className="text-sm font-medium">{notification.message}</span>
    </div>
  ) : null;

  return {
    notificationBanner,
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
