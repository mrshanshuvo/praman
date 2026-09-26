'use client';

import { ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';

export function MarketingNavbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <BrandLogo href={isAuthenticated ? '/dashboard' : '/'} size="md" />

        <div className="flex items-center gap-3">
          <ThemeToggle side="bottom" align="end" />

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={buttonVariants({
                size: 'sm',
                className:
                  'bg-primary text-primary-foreground font-semibold text-xs shadow-xs gap-1.5 cursor-pointer',
              })}
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={buttonVariants({
                  variant: 'ghost',
                  size: 'sm',
                  className: 'text-muted-foreground hover:text-foreground text-xs cursor-pointer',
                })}
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className={buttonVariants({
                  size: 'sm',
                  className:
                    'bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark font-semibold text-xs shadow-xs cursor-pointer',
                })}
              >
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
