'use client';

import {
  Briefcase,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useMemo } from 'react';
import { ThemePalettePicker } from '@/components/ThemePalettePicker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useJobs } from '@/hooks/usePramanApi';
import { useAuth } from '@/providers/AuthProvider';
import { useSidebar } from '@/providers/SidebarProvider';

export function TopBar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobileOpen, toggleMobile } = useSidebar();
  const { data: rawJobs } = useJobs({ enabled: isAuthenticated });

  const totalJobs = useMemo(() => {
    if (Array.isArray(rawJobs)) return rawJobs.length;
    if (rawJobs && Array.isArray((rawJobs as { items?: unknown[] }).items)) {
      return (rawJobs as { items: unknown[] }).items.length;
    }
    return 0;
  }, [rawJobs]);

  const initials = user?.name ? user.name.slice(0, 1) : user?.email?.slice(0, 1) || 'U';
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  // Dynamic Breadcrumb computation
  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{
      label: string;
      href?: string;
      icon?: React.ComponentType<{ className?: string }>;
    }> = [];

    if (pathname === '/dashboard') {
      crumbs.push({ label: 'Dashboard', icon: LayoutDashboard });
    } else if (pathname === '/jobs') {
      crumbs.push({ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard });
      crumbs.push({ label: 'Applications', icon: Briefcase });
    } else if (pathname === '/jobs/new') {
      crumbs.push({ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard });
      crumbs.push({ label: 'Applications', href: '/jobs', icon: Briefcase });
      crumbs.push({ label: 'New Pipeline', icon: Plus });
    } else if (pathname.startsWith('/jobs/')) {
      crumbs.push({ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard });
      crumbs.push({ label: 'Applications', href: '/jobs', icon: Briefcase });
      crumbs.push({ label: 'Job Inspector' });
    } else if (pathname.startsWith('/profile')) {
      crumbs.push({ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard });
      crumbs.push({ label: 'Candidate Profile', icon: User });
    } else {
      crumbs.push({ label: 'Command Center', icon: LayoutDashboard });
    }

    return crumbs;
  }, [pathname]);

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/60 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors select-none">
      {/* Left: Sidebar Toggles & Breadcrumb Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMobile}
          className="md:hidden h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Toggle mobile menu"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Desktop Sidebar Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapse}
          className="hidden md:flex h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar collapse"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-foreground" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>

        <div className="hidden sm:block h-4 w-px bg-border/80" />

        {/* Dynamic Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 min-w-0 text-xs font-medium"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const Icon = crumb.icon;

            return (
              <React.Fragment key={`${crumb.label}-${idx}`}>
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                )}
                {isLast ? (
                  <span className="flex items-center gap-1.5 font-semibold text-foreground truncate max-w-44 sm:max-w-xs">
                    {Icon && <Icon className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className="truncate">{crumb.label}</span>
                    {crumb.label === 'Applications' && totalJobs > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono px-1.5 py-0 rounded-full border-border bg-muted/50 text-muted-foreground ml-1"
                      >
                        {totalJobs}
                      </Badge>
                    )}
                  </span>
                ) : (
                  <Link
                    href={crumb.href || '/'}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate max-w-32"
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{crumb.label}</span>
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Quick Action, Theme Switcher & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Quick Ingest / New Pipeline CTA */}
        <Link
          href="/jobs/new"
          className={buttonVariants({
            size: 'sm',
            className:
              'h-8 px-2.5 sm:px-3 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-2xs rounded-lg transition-all',
          })}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">New Pipeline</span>
        </Link>

        {/* Dynamic Theme & Palette Switcher */}
        <ThemePalettePicker side="bottom" align="end" />

        {/* User Profile Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-1.5 sm:px-2 rounded-lg gap-2 border border-border bg-card/60 hover:bg-accent hover:text-accent-foreground text-foreground transition-all cursor-pointer group"
                aria-label="User navigation menu"
              >
                <Avatar size="sm" className="size-6 shrink-0 ring-1 ring-border">
                  <AvatarFallback className="bg-linear-to-tr from-brand-cyan to-brand-pink text-[11px] font-bold text-brand-dark uppercase">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs font-semibold max-w-28 truncate leading-tight">
                  {displayName}
                </span>
              </Button>
            }
          />

          <DropdownMenuContent
            side="bottom"
            align="end"
            sideOffset={6}
            className="w-60 p-1.5 shadow-xl border border-border bg-card/95 backdrop-blur-md"
          >
            {/* Header info */}
            <div className="px-2 py-2 mb-1 rounded-lg bg-muted/40">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                  <ShieldCheck className="w-3 h-3 text-success" />
                  Candidate
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
            </div>

            <DropdownMenuSeparator />

            {/* Nav shortcuts */}
            <DropdownMenuItem
              render={
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer text-xs"
                />
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Dashboard</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              render={
                <Link
                  href="/jobs"
                  className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer text-xs"
                />
              }
            >
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Applications Pipeline</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              render={
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer text-xs"
                />
              }
            >
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Candidate Profile</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out Action */}
            <DropdownMenuItem
              onClick={() => logout()}
              variant="destructive"
              className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
