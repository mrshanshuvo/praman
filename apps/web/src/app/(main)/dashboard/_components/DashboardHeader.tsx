'use client';

import { Briefcase, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';

interface DashboardHeaderProps {
  totalJobs: number;
  candidateName?: string | null;
}

export function DashboardHeader({ totalJobs, candidateName }: DashboardHeaderProps) {
  const { user } = useAuth();
  const displayName = candidateName || user?.name || user?.email?.split('@')[0] || 'Candidate';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {displayName}
          </h1>
          <span className="text-xl">👋</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Platform command center · Tracking {totalJobs} active position{totalJobs === 1 ? '' : 's'}{' '}
          with verifiable tailoring.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link href="/jobs">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-border bg-card">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </Button>
        </Link>

        <Link href="/profile">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-border bg-card">
            <User className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </Button>
        </Link>

        <Link href="/jobs/new">
          <Button
            size="sm"
            className="text-xs gap-1.5 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Application</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
