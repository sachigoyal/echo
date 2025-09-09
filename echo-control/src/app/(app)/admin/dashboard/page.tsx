import { UserEarningsTable } from '@/app/(app)/admin/_components';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { unauthorized } from 'next/navigation';

export default async function AdminEarningsDashboard(
  props: PageProps<'/admin/dashboard'>
) {
  const user = await userOrRedirect('/admin/dashboard', props);

  if (!user) {
    return unauthorized();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Earnings Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive view of user earnings and transaction aggregates across
          all apps
        </p>
      </div>
      <UserEarningsTable />
    </div>
  );
}
