import { CreditGrantForm } from '@/app/(app)/admin/codes/_components/form';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { api, HydrateClient } from '@/trpc/server';
import { Body, Heading } from '../../_components/layout/page-utils';
import { CreditGrantsTable } from './_components/table';

export default async function AdminCodesPage(props: PageProps<'/admin/codes'>) {
  await userOrRedirect('/admin/codes', props);

  api.admin.creditGrants.list.prefetchInfinite({
    cursor: 0,
  });

  return (
    <HydrateClient>
      <Heading
        title="Credit Grants"
        description="Manage and mint credit grants for users to get free credits"
      />
      <Body>
        <CreditGrantForm />
        <CreditGrantsTable />
      </Body>
    </HydrateClient>
  );
}
