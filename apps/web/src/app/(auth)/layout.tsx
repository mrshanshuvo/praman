import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { buttonVariants } from '@/components/ui/button';
import { AuthBackground } from './_components';

export const metadata: Metadata = {
  title: 'Authentication | Praman',
  description: 'Sign in or register for your verified Praman candidate account.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <AuthBackground />

      {/* Floating utility bar: Back link + Theme Toggle */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between max-w-7xl mx-auto w-full px-2">
        <Link
          href="/"
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className:
              'gap-1.5 text-xs dark:text-brand-cyan hover:text-foreground bg-card/60 backdrop-blur-md border border-border/60 rounded-lg shadow-sm',
          })}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Auth Card Container */}
      <div className="w-full max-w-md relative z-10 my-auto pt-12 pb-6">{children}</div>
    </div>
  );
}
