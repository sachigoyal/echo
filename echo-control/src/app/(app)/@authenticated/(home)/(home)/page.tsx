import { Apps } from './_components/apps';
import { Activity } from './_components/activity';
import { Body, Heading } from '../../_components/layout/page-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return <p>You should not be able to see this page, this is a bug.</p>;
  }

  return (
    <div>
      <Heading
        title={`Welcome Back${session.user.name ? `, ${session.user.name.split(' ')[0]}!` : '!'}`}
        description="Manage your apps and API keys"
        actions={
          <Link href="/new">
            <Button variant="turbo">New App</Button>
          </Link>
        }
      />
      <Body>
        <Apps />
        <Activity />
      </Body>
    </div>
  );
}
