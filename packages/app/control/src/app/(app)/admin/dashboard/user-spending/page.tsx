import React from 'react';
import UserSpendingTable from '@/app/(app)/admin/_components/table/UserSpending';
import { TableLayout } from '@/app/(app)/admin/_components';
import { UserSpendingOverview } from '@/app/(app)/admin/_components/overview/UserSpending';

export default function UserSpendingPage() {
  return (
    <TableLayout
      title="User Spending"
      description="Analyze user spending patterns and credit usage across the platform"
    >
      <UserSpendingOverview />
      <UserSpendingTable />
    </TableLayout>
  );
}
