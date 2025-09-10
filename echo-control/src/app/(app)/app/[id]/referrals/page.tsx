import { PublicReferralsPage } from './_components/public';
import { OwnerReferralsPage } from './_components/owner';

import { getApp, getIsOwner } from '../_lib/fetch';

import type { Metadata } from 'next';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Referrals',
};

export default async function AppReferralsPage(
  props: PageProps<'/app/[id]/referrals'>
) {
  const { id } = await props.params;

  const user = await userOrRedirect(`/app/${id}/referrals`, props);

  try {
    await getApp(id);
  } catch (error) {
    return notFound();
  }

  const isOwner = await getIsOwner(id);

  if (isOwner) {
    return <OwnerReferralsPage appId={id} />;
  }

  return <PublicReferralsPage appId={id} userId={user.id} />;
}
