import { userOrRedirectLayout } from '@/auth/user-or-redirect';
import { api } from '@/trpc/server';
import { forbidden } from 'next/navigation';
import { Nav } from '@/app/(app)/_components/layout/nav';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await userOrRedirectLayout('/admin');

  const isAdmin = await api.admin.isAdmin();

  if (!isAdmin) {
    return forbidden();
  }

  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'Dashboard',
            href: '/admin/dashboard',
            subRoutes: [
              '/admin/dashboard/user-earnings',
              '/admin/dashboard/user-spending',
              '/admin/dashboard/app-earnings',
              '/admin/dashboard/payments',
            ],
          },
          {
            label: 'Tools',
            href: '/admin/tools',
          },
          {
            label: 'Payouts',
            href: '/admin/payouts',
          },
          {
            label: 'Referral Codes',
            href: '/admin/codes',
          },
        ]}
      />
      <div className="flex flex-col pb-6 md:pb-8 flex-1">{children}</div>
    </div>
  );
}
