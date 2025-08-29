import { UserTransactionDetails } from '@/app/admin/_components';

interface PageProps {
  params: { userId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function AdminUserTransactionsPage({ params }: PageProps) {
  const { userId } = params;
  return (
    <div className="container mx-auto py-8">
      <UserTransactionDetails userId={userId} />
    </div>
  );
}
