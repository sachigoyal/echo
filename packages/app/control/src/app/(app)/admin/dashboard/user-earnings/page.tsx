import UserEarningsTable from '@/app/(app)/admin/_components/v2/UserEarnings';

export default function UserEarningsPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Earnings</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive view of user earnings and transaction aggregates across all apps
        </p>
      </div>
      <UserEarningsTable />
    </div>
  );
}
