import type { Metadata } from 'next';
import type React from 'react';
import { AuthBackground } from '@/components/AuthBackground';

export const metadata: Metadata = {
  title: 'Authentication | Praman',
  description: 'Sign in or register for your verified Praman candidate account.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
