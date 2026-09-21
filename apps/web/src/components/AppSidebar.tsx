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
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-border">
        <BrandLogo href="/dashboard" size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4 font-mono font-bold bg-brand-cyan/20 text-brand-cyan"
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block px-2">
              Recent Applications
            </span>
            <div className="space-y-1">
              {recentJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors group"
                >
                  <span className="truncate max-w-40 font-medium">
                    {j.structured?.jobTitle || 'Target Position'}
                  </span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar size="sm" className="size-7 shrink-0">
              <AvatarFallback className="bg-linear-to-tr from-brand-cyan to-brand-pink text-[11px] font-bold text-brand-dark uppercase">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="p-1.5 h-7 w-7 text-muted-foreground hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
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
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
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
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
