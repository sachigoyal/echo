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
    <div>
      <div className="flex flex-col gap-8 w-full py-8">
        <div className="flex flex-col lg:flex-row gap-1">
          <div className="w-[140px] flex-shrink-0 lg:sticky lg:top-0 lg:pl-4">
            <DashboardNav />
          </div>
          <div className="flex-1 flex flex-col gap-6 px-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
