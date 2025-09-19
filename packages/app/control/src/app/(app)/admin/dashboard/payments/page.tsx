import PaymentHistoryTable from '@/app/(app)/admin/_components/table/PaymentHistory';
import { PaymentsOverview } from '@/app/(app)/admin/_components/overview/PaymentHistory';
import { TableLayout } from '@/app/(app)/admin/_components';

export default function PaymentHistoryPage() {
  return (
    <TableLayout
      title="Payment History"
      description="Review payment transactions and payout history"
    >
      <PaymentsOverview />
      <PaymentHistoryTable />
    </TableLayout>
  );
}
