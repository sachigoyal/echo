import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Body, Heading } from '../../_components/layout/page-utils';

import { NewAppButton } from './_components/new-app';
import { Apps } from './_components/apps';
import { Activity } from './_components/activity';
import { PopularApps } from './_components/popular';
import { Feed } from './_components/feed';

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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-full w-full">
          <div className="flex flex-col gap-6 w-full md:col-span-5 lg:col-span-4 max-w-full overflow-hidden shrink-0 pt-2">
            <Apps userApps={userApps} />
            <Feed numAppsPromise={numAppsPromise} feedPromise={feedPromise} />
          </div>
          <div className="flex flex-col gap-6 flex-1 overflow-hidden py-2 md:col-span-7 lg:col-span-8">
            <Activity numAppsPromise={numAppsPromise} />
          </div>
        </div>
        <PopularApps />
      </Body>
    </div>
  );
}
