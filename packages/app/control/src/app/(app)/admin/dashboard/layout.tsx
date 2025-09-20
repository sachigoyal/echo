import { DashboardNav } from './_components/nav';

import type { Metadata } from 'next';
import { userOrRedirectLayout } from '@/auth/user-or-redirect';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await userOrRedirectLayout('/admin/dashboard');

  return (
    <div className="min-h-screen">
      <div className="flex flex-col w-full">
        {/* Mobile nav - horizontal scrollable */}
        <div className="lg:hidden sticky top-0 z-10 bg-background border-b px-4 py-3">
          <DashboardNav />
        </div>

        {/* Desktop layout */}
        <div className="flex flex-col lg:flex-row gap-1 py-4 lg:py-8">
          {/* Desktop nav - vertical sidebar */}
          <div className="hidden lg:block w-[180px] flex-shrink-0 lg:sticky lg:top-0 lg:pl-4">
            <DashboardNav />
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col gap-6 px-4 lg:px-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
