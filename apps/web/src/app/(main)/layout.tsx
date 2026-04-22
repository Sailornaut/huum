'use client';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto flex max-w-7xl">
          {/* Desktop sidebar */}
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 lg:block">
            <Sidebar />
          </aside>

          {/* Main content */}
          <main className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-6 pb-20 lg:px-8 lg:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    </AuthGuard>
  );
}
