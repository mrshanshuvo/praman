'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthBackground } from '@/components/AuthBackground';
import { useAuth } from '@/providers/AuthProvider';
import { RegisterForm } from './_components';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/profile');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-md relative z-10">
        <RegisterForm />
      </div>
    </div>
  );
}
