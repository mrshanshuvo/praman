import type React from 'react';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNavbar } from '@/components/MarketingNavbar';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
