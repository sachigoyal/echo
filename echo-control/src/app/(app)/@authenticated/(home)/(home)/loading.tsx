import { Body, Heading } from '../../_components/layout/page-utils';

import { LoadingAppsSection } from './_components/apps';
import { LoadingActivity } from './_components/activity';

import { auth } from '@/auth';

export default async function LoadingDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div>
      <Heading
        title={`Welcome Back${session?.user.name ? `, ${session.user.name.split(' ')[0]}!` : '!'}`}
        description="Build apps and make money risk free"
      />
      <Body>
        <div className="flex flex-col md:flex-row gap-8 md:gap-4 max-w-full w-full">
          <div className="flex flex-col gap-4 w-full md:w-80 lg:w-96 max-w-full overflow-hidden shrink-0 pt-2">
            <LoadingAppsSection />
          </div>
          <div className="flex flex-col gap-4 flex-1 overflow-hidden py-2">
            <LoadingActivity />
          </div>
        </div>
      </Body>
    </div>
  );
}
