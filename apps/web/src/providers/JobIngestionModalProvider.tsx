'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { JobIngestionModal } from '@/components/JobIngestionModal';

interface JobIngestionModalContextType {
  isOpen: boolean;
  openJobIngestionModal: (initialText?: string) => void;
  closeJobIngestionModal: () => void;
}

const JobIngestionModalContext = createContext<JobIngestionModalContextType | undefined>(undefined);

export function JobIngestionModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialText, setInitialText] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Listen for ?new=true query param to open modal automatically
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsOpen(true);
    }
  }, [searchParams]);

  const openJobIngestionModal = useCallback((text?: string) => {
    if (text) setInitialText(text);
    setIsOpen(true);
  }, []);

  const closeJobIngestionModal = useCallback(() => {
    setIsOpen(false);
    setInitialText('');
    // If URL had ?new=true, clean it up without full page reload
    if (searchParams.get('new') === 'true') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('new');
      const newQuery = params.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const value = useMemo(
    () => ({
      isOpen,
      openJobIngestionModal,
      closeJobIngestionModal,
    }),
    [isOpen, openJobIngestionModal, closeJobIngestionModal],
  );

  return (
    <JobIngestionModalContext.Provider value={value}>
      {children}
      <JobIngestionModal
        isOpen={isOpen}
        onClose={closeJobIngestionModal}
        defaultText={initialText}
      />
    </JobIngestionModalContext.Provider>
  );
}

export function useJobIngestionModal() {
  const context = useContext(JobIngestionModalContext);
  if (!context) {
    throw new Error('useJobIngestionModal must be used within a JobIngestionModalProvider');
  }
  return context;
}
