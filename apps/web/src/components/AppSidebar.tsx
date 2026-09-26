'use client';

import type { JobDescriptionRecord } from '@praman/schemas';
import { Briefcase, ChevronRight, LayoutDashboard, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from '@/providers/SidebarProvider';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const { data: rawJobs, isLoading: isJobsLoading } = useJobs({ enabled: isAuthenticated });
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Defensively extract jobs array across array payloads or paginated { items: [] } shapes
  const jobs: JobDescriptionRecord[] = React.useMemo(() => {
    if (Array.isArray(rawJobs)) return rawJobs;
    if (
      rawJobs &&
      Array.isArray((rawJobs as unknown as { items?: JobDescriptionRecord[] }).items)
    ) {
      return (rawJobs as unknown as { items: JobDescriptionRecord[] }).items;
    }
    return [];
  }, [rawJobs]);

  // Captured after mount so Date.now() is never called during render
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  // Active upcoming interviews count across all jobs
  const upcomingCount = jobs.reduce((acc, job) => {
    const scheduled = (job.tracker?.milestones || []).filter(
      (m) => m.status === 'SCHEDULED' && m.scheduledAt,
    );
    return acc + scheduled.length;
  }, 0);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/jobs', label: 'Applications', icon: Briefcase, badgeCount: upcomingCount },
    { href: '/profile', label: 'Candidate Profile', icon: User },
  ];

  const recentJobs = jobs.slice(0, 4);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/90 backdrop-blur-md border-r border-border select-none">
      {/* Brand Header */}
      <div
        className={`h-14 flex items-center border-b border-border ${
          isCollapsed ? 'justify-center px-1' : 'px-4'
        }`}
      >
        <BrandLogo href="/dashboard" size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} />
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === '/jobs'
              ? pathname?.startsWith('/jobs')
              : item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`relative flex items-center rounded-xl text-xs font-semibold transition-all group ${
                isCollapsed ? 'size-10 mx-auto justify-center' : 'gap-3 px-3 py-2'
              } ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-2xs font-bold'
                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {isCollapsed && item.badgeCount && item.badgeCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-cyan ring-2 ring-card" />
              ) : null}
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="text-2xs px-1.5 py-0 h-4 font-mono font-bold bg-brand-cyan/20 text-brand-cyan"
                    >
                      {item.badgeCount}
                    </Badge>
                  ) : null}
                </div>
              )}
            </Link>
          );
        })}

        {/* Recent Applications in expanded mode */}
        {!isCollapsed && (
          <div className="pt-5 px-1 space-y-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block px-2">
              Recent Applications
            </span>

            {isJobsLoading ? (
              <div className="space-y-1 px-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-1.5 py-2 space-y-1.5">
                    <Skeleton className="h-3.5 w-4/5 rounded bg-muted/60" />
                    <Skeleton className="h-2.5 w-3/5 rounded bg-muted/40" />
                    <Skeleton className="h-2 w-2/5 rounded bg-muted/30" />
                  </div>
                ))}
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-0.5">
                {recentJobs.map((j) => {
                  const score = j.analysis?.matchScore != null ? j.analysis.matchScore : null;
                  const company = j.structured?.company;
                  const status = (j.status || 'SAVED').toUpperCase();
                  const dateStr = (() => {
                    if (!j.createdAt || now === null) return null;
                    const daysAgo = Math.floor(
                      (now - new Date(j.createdAt).getTime()) / (1000 * 60 * 60 * 24),
                    );
                    if (daysAgo === 0) return 'today';
                    if (daysAgo === 1) return '1d ago';
                    if (daysAgo < 30) return `${daysAgo}d ago`;
                    return new Date(j.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  })();

                  const statusColor: Record<string, string> = {
                    SAVED: 'bg-muted-foreground/60',
                    APPLIED: 'bg-primary',
                    INTERVIEWING: 'bg-warning',
                    OFFER: 'bg-success',
                    REJECTED: 'bg-destructive',
                  };

                  return (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center justify-between px-2 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        {/* Title */}
                        <p className="truncate font-semibold text-foreground text-xs leading-snug group-hover:text-brand-cyan transition-colors">
                          {j.structured?.jobTitle || 'Target Position'}
                        </p>
                        {/* Company + status dot */}
                        <p className="text-2xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-block size-1.5 rounded-full shrink-0 ${statusColor[status] ?? 'bg-muted-foreground/60'}`}
                          />
                          <span className="truncate">{company || 'Unknown Company'}</span>
                        </p>
                        {/* Score + date */}
                        <p className="text-2xs flex items-center gap-1.5 mt-0.5">
                          {score != null ? (
                            <span className="font-mono font-bold text-brand-cyan">{score}%</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic">no score</span>
                          )}
                          {dateStr && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="text-muted-foreground/60">{dateStr}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom Logout Action */}
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => logout()}
          className={`flex items-center rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer w-full ${
            isCollapsed ? 'size-10 justify-center mx-auto' : 'gap-3 px-3 py-2'
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex">
          <div className="w-64 h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
          <button
            type="button"
            className="flex-1"
            aria-label="Close drawer"
            onClick={() => setIsMobileOpen(false)}
          />
        </div>
      )}

      {/* Desktop Fixed/Collapsible Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen transition-all duration-200 sticky top-0 z-30 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
