import { AppTransactionDetails } from '@/app/(app)/admin/_components';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { unauthorized } from 'next/navigation';

export default async function AdminAppTransactionsPage(
  props: PageProps<'/admin/apps/[appId]'>
) {
  const { appId } = await props.params;
  const user = await userOrRedirect(`/admin/apps/${appId}`, props);

  if (!user) {
    return unauthorized();
  }

  return (
    <div className="container mx-auto py-8">
      <AppTransactionDetails appId={appId} />
    </div>
  );
}
