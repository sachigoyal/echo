import { Nav } from '@/app/(app)/_components/layout/nav';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Nav
        tabs={[
          {
            label: 'User Earnings',
            href: '/admin/dashboard/user-earnings',
          },
          {
            label: 'User Spending',
            href: '/admin/dashboard/user-spending',
          },
          {
            label: 'App Earnings',
            href: '/admin/dashboard/app-earnings',
          },
          {
            label: 'Payment History',
            href: '/admin/dashboard/payments',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
