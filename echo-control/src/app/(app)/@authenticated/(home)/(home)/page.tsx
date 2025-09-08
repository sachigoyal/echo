import { Body, Heading } from '../../_components/layout/page-utils';

import { GlobalSection } from './_components/global';
import { PersonalSection } from './_components/personal';

import { auth } from '@/auth';
import { Separator } from '@/components/ui/separator';

export default async function DashboardPage() {
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
        <PersonalSection />
      </Body>
      <Separator />
      <Body>
        <GlobalSection />
      </Body>
    </div>
  );
}
