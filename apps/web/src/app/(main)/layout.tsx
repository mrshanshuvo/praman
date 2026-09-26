import React, { Suspense } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { TopBar } from '@/components/TopBar';
import { JobIngestionModalProvider } from '@/providers/JobIngestionModalProvider';
import { SidebarProvider } from '@/providers/SidebarProvider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <JobIngestionModalProvider>
          <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto min-h-0 bg-background flex flex-col">
                {children}
              </main>
            </div>
          </div>
        </JobIngestionModalProvider>
      </Suspense>
    </SidebarProvider>
  );
}
