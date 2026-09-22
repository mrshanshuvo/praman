'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ProfileNotification {
  type: 'success' | 'error';
  message: string;
}

interface ProfileNotificationBannerProps {
  notification: ProfileNotification | null;
}

export function ProfileNotificationBanner({ notification }: ProfileNotificationBannerProps) {
  if (!notification) return null;

  return (
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
  );
}
