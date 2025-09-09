import { GeneralAppSettings } from '../_components';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { getIsOwner } from '../../../_lib/fetch';
import { notFound } from 'next/navigation';

export default async function GeneralAppSettingsPage(
  props: PageProps<'/app/[id]/settings/general'>
) {
  const { id } = await props.params;

  await userOrRedirect(`/app/${id}/settings/general`, props);

  const isOwner = await getIsOwner(id);

  if (!isOwner) {
    return notFound();
  }

  return <GeneralAppSettings appId={id} />;
}
