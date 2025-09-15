import { Nav } from '@/app/(app)/_components/layout/nav';

export default function DashboardV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      <Nav
        tabs={[
          {
            label: 'User Earnings',
            href: '/admin/dashboard/v2/user-earnings',
          },
          {
            label: 'App Earnings', 
            href: '/admin/dashboard/v2/app-earnings',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8 flex-1">{children}</div>
    </div>
  );
}
