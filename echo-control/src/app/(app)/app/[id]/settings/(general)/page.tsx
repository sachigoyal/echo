import { SettingsNav } from '../_components/nav';
import { getIsOwner } from '../../_lib/fetch';
import { notFound } from 'next/navigation';

import { GeneralAppSettings } from './_components';
import { userOrRedirect } from '@/auth/user-or-redirect';

export default async function AppSettingsPage(
  props: PageProps<'/app/[id]/settings'>
) {
  const { id } = await props.params;

  await userOrRedirect(`/app/${id}/settings/general`, props);

  const isOwner = await getIsOwner(id);

  if (!isOwner) {
    return notFound();
  }

  return (
    <>
      <div className="w-full lg:hidden">
        <SettingsNav appId={id} />
      </div>
      <div className="w-full hidden lg:block">
        <GeneralAppSettings appId={id} />
      </div>
    </>
  );
}
