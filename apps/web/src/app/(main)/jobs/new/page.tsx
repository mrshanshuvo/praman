'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Route deprecated in favor of the global JobIngestionModal.
 * Redirects to /jobs?new=true to open the modal seamlessly over the applications list.
 */
export default function NewJobRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/jobs?new=true');
  }, [router]);

  return null;
}
