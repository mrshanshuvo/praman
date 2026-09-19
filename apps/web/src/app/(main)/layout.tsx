import type React from 'react';
import { Navbar } from '@/components/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
    </div>
  );
}
