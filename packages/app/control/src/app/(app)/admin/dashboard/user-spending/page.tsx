import React from 'react';
import UserSpendingTable from '@/app/(app)/admin/_components/v2/UserSpending';

export default function UserSpendingPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Spending</h1>
        <p className="text-muted-foreground mt-2">
          Analyze user spending patterns and credit usage across the platform
        </p>
      </div>
      <UserSpendingTable />
    </div>
  );
}
