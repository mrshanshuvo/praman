'use client';

import {
  Briefcase,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: jobs = [] } = useJobs();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    { href: '/jobs/new', label: 'New Pipeline', icon: PlusCircle },
    { href: '/profile', label: 'Candidate Profile', icon: User },
  ];

  const recentJobs = jobs.slice(0, 3);
  const initials = user?.name ? user.name.slice(0, 1) : user?.email?.slice(0, 1) || 'U';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card/90 backdrop-blur-md border-r border-border select-none">
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center border-b border-border ${
          isCollapsed ? 'justify-center px-1' : 'justify-between px-3.5'
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="size-10 flex items-center justify-center rounded-xl hover:bg-muted/60 transition-colors group cursor-pointer relative"
            title="Expand sidebar"
          >
            <div className="group-hover:opacity-0 transition-opacity">
              <BrandLogo href={null} size="sm" showText={false} />
            </div>
            <PanelLeftOpen className="w-5 h-5 text-foreground absolute opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <>
            <BrandLogo href="/dashboard" size="md" showText={true} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="hidden md:flex p-1.5 h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              pathname?.startsWith(item.href) &&
              item.href !== '/jobs');

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
        {!isCollapsed && recentJobs.length > 0 && (
          <div className="pt-5 px-1 space-y-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground block px-2">
              Recent Applications
            </span>
            <div className="space-y-1">
              {recentJobs.map((j) => {
                const score = j.analysis?.result?.overallScore;
                const details = [j.structured?.seniority, j.structured?.locationOrWorkMode]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors group"
                  >
                    <div className="min-w-0 flex-1 pr-1.5">
                      <p className="truncate font-medium text-foreground text-xs leading-snug group-hover:text-primary transition-colors">
                        {j.structured?.jobTitle || 'Target Position'}
                      </p>
                      <p className="text-2xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize">{j.status.toLowerCase()}</span>
                        {details ? (
                          <>
                            <span>·</span>
                            <span className="truncate">{details}</span>
                          </>
                        ) : null}
                        {score != null ? (
                          <>
                            <span>·</span>
                            <span className="font-mono font-semibold text-brand-cyan">
                              {score}%
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Profile Section */}
      <div
        className={`border-t border-border ${
          isCollapsed ? 'p-2 py-3 flex flex-col items-center gap-2.5' : 'p-3 space-y-2.5'
        }`}
      >
        {isCollapsed ? (
          <>
            <div
              className="relative group cursor-pointer"
              title={`${user?.name || 'User'} (${user?.email})`}
            >
              <Avatar size="sm" className="size-9 shrink-0 ring-1 ring-border">
                <AvatarFallback className="bg-linear-to-tr from-brand-cyan to-brand-pink text-xs font-bold text-brand-dark uppercase">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div
              className="size-9 flex items-center justify-center rounded-xl hover:bg-muted/60 transition-colors"
              title="Toggle Theme"
            >
              <ThemeToggle />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="size-9 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar size="sm" className="size-8 shrink-0">
                <AvatarFallback className="bg-linear-to-tr from-brand-cyan to-brand-pink text-xs font-bold text-brand-dark uppercase">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="truncate flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
                <p className="text-2xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ThemeToggle />
                <span className="text-2xs font-medium text-muted-foreground">Theme</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-7 px-2 text-2xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden h-14 border-b border-border bg-card/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo href="/dashboard" size="sm" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 h-8 w-8"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

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
