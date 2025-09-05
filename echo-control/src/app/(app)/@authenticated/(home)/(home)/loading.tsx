import { Body, Heading } from '../../_components/layout/page-utils';

import { LoadingPopularApps } from './_components/popular';

import { auth } from '@/auth';
import { LoadingPersonalOverview } from './_components/personal';

export default async function LoadingDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div>
      <Heading
        title={`Welcome Back${session?.user.name ? `, ${session.user.name.split(' ')[0]}!` : '!'}`}
        description="Build AI apps and earn profit on every token your users generate"
      />
      <Body>
        <LoadingPersonalOverview />
        <LoadingPopularApps />
      </Body>
    </div>
  );
}
