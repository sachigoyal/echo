import { LoadingAppsSection } from './_components/apps';
import { Body, Heading } from '../../_components/layout/page-utils';
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
        <LoadingAppsSection />
      </Body>
    </div>
  );
}
