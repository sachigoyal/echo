import { userOrRedirect } from '@/auth/user-or-redirect';
import HomePageChart from '@/app/(app)/admin/_components/chart/HomePage';
import { TableLayout } from '@/app/(app)/admin/_components';

export default async function AdminDashboard(
  props: PageProps<'/admin/dashboard'>
) {
  await userOrRedirect('/admin/dashboard', props);

  return (
    <TableLayout
      title="Admin Dashboard"
    >
      <HomePageChart />
    </TableLayout>
  );
}
