import UserEarningsTable from '@/app/(app)/admin/_components/table/UserEarnings';
import { TableLayout } from '@/app/(app)/admin/_components';
import { UserEarningsOverview } from '@/app/(app)/admin/_components/overview/UserEarnings';

export default function UserEarningsPage() {
  return (
    <TableLayout
      title="User Earnings"
      description="Comprehensive view of user earnings and transaction aggregates across all apps"
    >
      <UserEarningsOverview />
      <UserEarningsTable />
    </TableLayout>
  );
}
