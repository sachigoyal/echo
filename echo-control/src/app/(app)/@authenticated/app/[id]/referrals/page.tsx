import { PublicReferralsPage } from './_components/public';
import { OwnerReferralsPage } from './_components/owner';

import { getIsOwner } from '../_lib/fetch';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referrals',
};

export default async function AppReferralsPage({
  params,
}: PageProps<'/app/[id]/referrals'>) {
  const { id } = await params;

  const isOwner = await getIsOwner(id);

  if (isOwner) {
    return <OwnerReferralsPage appId={id} />;
  }

  return <PublicReferralsPage appId={id} />;
}
