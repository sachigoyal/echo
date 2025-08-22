import { notFound } from 'next/navigation';

import { Body, Heading } from '../../../_components/layout/page-utils';

import { Activity } from './_components/activity';

import { api, HydrateClient } from '@/trpc/server';
import { UserAvatar } from '@/components/utils/user-avatar';
import { Code } from 'lucide-react';
import { Setup } from './_components/setup';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default async function AppPage({ params }: PageProps<'/app/[id]'>) {
  const { id } = await params;

  const app = await api.apps.public.get(id);
  api.apps.public.get.prefetch(id);
  api.apps.owner.getGithubLink.prefetch({ appId: id });

  if (!app) {
    return notFound();
  }

  return (
    <HydrateClient>
      <Heading
        title={app.name}
        description={app.description ?? undefined}
        icon={
          <UserAvatar
            src={app.profilePictureUrl ?? undefined}
            className="size-12 shrink-0"
            fallback={<Code className="size-8" />}
          />
        }
      />
      <Body className="gap-8">
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Setup appId={id} />
          </Suspense>
        </ErrorBoundary>
        <Activity appId={id} />
      </Body>
    </HydrateClient>
  );
}
