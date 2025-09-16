import AppEarningsTable from '@/app/(app)/admin/_components/v2/AppEarnings';

export default function AppEarningsPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">App Earnings</h1>
        <p className="text-muted-foreground mt-2">
          Monitor app performance and revenue generation metrics
        </p>
      </div>
      <AppEarningsTable />
    </div>
  );
}
