import { userOrRedirect } from '@/auth/user-or-redirect';
import { AuthorizedCallbacksForm } from './_components/authorized-callbacks';
import { getIsOwner } from '../../_lib/fetch';
import { notFound } from 'next/navigation';

export default async function SecurityAppSettingsPage(
  props: PageProps<'/app/[id]/settings/security'>
) {
  const { id } = await props.params;

  await userOrRedirect(`/app/${id}/settings/security`, props);

  const isOwner = await getIsOwner(id);

  if (!isOwner) {
    return notFound();
  }

  return <AuthorizedCallbacksForm appId={id} />;
}
