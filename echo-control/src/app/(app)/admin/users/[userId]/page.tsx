import { UserTransactionDetails } from '@/app/(app)/admin/_components';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { unauthorized } from 'next/navigation';

export default async function AdminUserTransactionsPage(
  props: PageProps<'/admin/users/[userId]'>
) {
  const { userId } = await props.params;
  const user = await userOrRedirect(`/admin/users/${userId}`, props);

  if (!user) {
    return unauthorized();
  }

  return (
    <div className="container mx-auto py-8">
      <UserTransactionDetails userId={userId} />
    </div>
  );
}
