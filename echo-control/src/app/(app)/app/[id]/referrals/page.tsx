import { PublicReferralsPage } from './_components/public';
import { OwnerReferralsPage } from './_components/owner';

import { getIsOwner } from '../_lib/fetch';

import type { Metadata } from 'next';
import { userOrRedirect } from '@/auth/user-or-redirect';

export const metadata: Metadata = {
  title: 'Referrals',
};

export default async function AppReferralsPage(
  props: PageProps<'/app/[id]/referrals'>
) {
  const { id } = await props.params;

  await userOrRedirect(`/app/${id}/referrals`, props);

  const isOwner = await getIsOwner(id);

  if (isOwner) {
    return <OwnerReferralsPage appId={id} />;
  }

  return <PublicReferralsPage appId={id} />;
}
