import type React from 'react';
import { AppSidebar } from '@/components/AppSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto min-h-0 bg-background">{children}</main>
    </div>
  );
}
