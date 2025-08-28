import { Apps } from './_components/apps';
import { Activity } from './_components/activity';
import { Body, Heading } from '../../_components/layout/page-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { api } from '@/trpc/server';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div>
      <Heading
        title={`Welcome Back${session?.user.name ? `, ${session.user.name.split(' ')[0]}!` : '!'}`}
        description="Build apps and make money risk free"
        actions={
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <NewAppButton />
            </Suspense>
          </ErrorBoundary>
        }
      />
      <Body>
        <div className="flex flex-col md:flex-row gap-8 md:gap-4 max-w-full w-full">
          <div className="flex flex-col gap-4 w-full md:w-80 lg:w-96 max-w-full overflow-hidden shrink-0 pt-2">
            <Apps />
          </div>
          <div className="flex flex-col gap-4 flex-1 overflow-hidden py-2">
            <Activity />
          </div>
        </div>
      </Body>
    </div>
  );
}

const NewAppButton = async () => {
  const numApps = await api.apps.count.owner();

  if (numApps === 0) {
    return null;
  }

  return (
    <Link href="/new">
      <Button variant="turbo">New App</Button>
    </Link>
  );
};
