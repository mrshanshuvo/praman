'use client';

import { LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';

export function UserNav() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/login"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className:
              'text-muted-foreground hover:text-foreground font-medium text-xs transition cursor-pointer',
          })}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </Link>
        <Link
          href="/register"
          className={buttonVariants({
            size: 'sm',
            className:
              'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs shadow-xs transition cursor-pointer',
          })}
        >
          <span>Get Started</span>
        </Link>
      </div>
    );
  }

  const initials = user.name ? user.name.slice(0, 1) : user.email.slice(0, 1);

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-card border border-border text-xs font-medium text-foreground max-w-40 sm:max-w-none truncate"
        title={user.email}
      >
        <Avatar size="sm" className="size-5 shrink-0">
          <AvatarFallback className="bg-linear-to-tr from-brand-cyan to-brand-pink text-2xs font-bold text-brand-dark uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline truncate">{user.name || user.email}</span>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => logout()}
        title="Sign Out"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
