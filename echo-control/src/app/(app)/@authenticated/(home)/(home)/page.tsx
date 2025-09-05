import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Body, Heading } from '../../_components/layout/page-utils';

import { NewAppButton } from './_components/new-app';
import { PopularApps } from './_components/popular';
import { PersonalOverview } from './_components/personal';

import { auth } from '@/auth';

import { api } from '@/trpc/server';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const userApps = api.apps.list.owner({
    page_size: 3,
  });
  const numAppsPromise = userApps.then(apps => apps.total_count);

  const feedPromise = api.user.feed.list({
    cursor: new Date(),
    limit: 5,
    numHours: 4,
  });

  return (
    <div>
      <Heading
        title={`Welcome Back${session?.user.name ? `, ${session.user.name.split(' ')[0]}!` : '!'}`}
        description="Build AI apps and earn profit on every token your users generate"
        actions={
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <NewAppButton />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Body>
        <PersonalOverview />
        <PopularApps />
      </Body>
    </div>
  );
}
