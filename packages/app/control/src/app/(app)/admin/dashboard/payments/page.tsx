import PaymentHistoryTable from '@/app/(app)/admin/_components/v2/PaymentHistory';

export default function PaymentHistoryPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground mt-2">
          Review payment transactions and payout history
        </p>
      </div>
      <PaymentHistoryTable />
    </div>
  );
}
