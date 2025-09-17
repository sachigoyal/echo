import { userOrRedirect } from '@/auth/user-or-redirect';
import TotalTokensChart from '@/app/(app)/admin/_components/chart/TotalTokens';

export default async function AdminDashboard(
  props: PageProps<'/admin/dashboard'>
) {
  await userOrRedirect('/admin/dashboard', props);

  return (
    <TotalTokensChart />
  );
}
