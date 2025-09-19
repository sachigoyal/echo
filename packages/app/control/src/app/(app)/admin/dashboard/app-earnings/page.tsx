import AppEarningsTable from '@/app/(app)/admin/_components/table/AppEarnings';
import { TableLayout } from '@/app/(app)/admin/_components';
import { AppEarningsOverview } from '@/app/(app)/admin/_components/overview/AppEarnings';

export default function AppEarningsPage() {
  return (
    <TableLayout
      title="App Earnings"
      description="Monitor app performance and revenue generation metrics"
    >
      <AppEarningsOverview />
      <AppEarningsTable />
    </TableLayout>
  );
}
