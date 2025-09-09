import { Suspense } from 'react';

import {
  GithubLinkForm,
  LoadingGithubLinkForm,
} from './_components/github-link';
import { LoadingMarkupForm, MarkupForm } from './_components/markup';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { getIsOwner } from '../../_lib/fetch';
import { notFound } from 'next/navigation';
export default async function MonetizationAppSettingsPage(
  props: PageProps<'/app/[id]/settings/monetization'>
) {
  const { id } = await props.params;

  await userOrRedirect(`/app/${id}/settings/monetization`, props);

  const isOwner = await getIsOwner(id);

  if (!isOwner) {
    return notFound();
  }

  return (
    <>
      <Suspense fallback={<LoadingMarkupForm />}>
        <MarkupForm appId={id} />
      </Suspense>
      <Suspense fallback={<LoadingGithubLinkForm />}>
        <GithubLinkForm appId={id} />
      </Suspense>
    </>
  );
}
