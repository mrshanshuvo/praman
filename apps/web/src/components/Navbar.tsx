'use client';

import { Briefcase, PlusCircle, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNav } from '@/components/UserNav';

import { useAuth } from '@/providers/AuthProvider';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const links = [
    { href: '/profile', label: 'Candidate Profile', icon: User },
    { href: '/jobs', label: 'Job Analyses', icon: Briefcase },
    { href: '/jobs/new', label: 'New Job (Pipeline)', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <Image
              src="/praman_light_mode_logo.svg"
              alt="Praman Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain dark:hidden"
              priority
            />
            <Image
              src="/praman_dark_mode_logo.svg"
              alt="Praman Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain hidden dark:block"
              priority
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-berkshire text-2xl sm:text-3xl text-brand-cyan font-normal tracking-wide leading-none select-none">
              praman
            </span>
            <span className="font-galada text-lg sm:text-xl text-brand-pink leading-none select-none">
              প্রমাণ
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Navigation Links (Protected - only for authenticated users) */}
          {isAuthenticated && (
            <>
              <nav className="flex items-center gap-1 sm:gap-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    pathname === link.href ||
                    (link.href !== '/' && pathname?.startsWith(link.href) && link.href !== '/jobs');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-card text-brand-pink border border-brand-pink/50 shadow-xs dark:text-foreground dark:border-brand-cyan/40'
                          : 'text-muted-foreground hover:text-brand-pink hover:bg-brand-pink/5 dark:hover:text-foreground dark:hover:bg-muted/80'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="h-4 w-px bg-border hidden sm:block" />
            </>
          )}

          <ThemeToggle />

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* User Auth Section (Far Right) */}
          <UserNav />
        </div>
      </div>
    </header>
  );
};
