import { auth } from '@/auth';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

import { BalanceButton } from './_components/header/balance';
import { UserDropdown } from './_components/header/user-dropdown';
import { LogoContainer } from './_components/logo';

export default async function AppLayout({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return <p>Unauthenticated</p>;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <LogoContainer>
        <Logo className="size-auto h-full aspect-square" />
      </LogoContainer>
      <header className="w-full flex flex-col pt-4 justify-center bg-card">
        <div className="flex items-center justify-between w-full px-2 md:px-6 pb-0 md:pb-0">
          <div className="pl-11">{breadcrumbs}</div>
          <div className="flex items-center space-x-3">
            <Link href="/apps/create">
              <Button variant="outline">Create App</Button>
            </Link>
            {session?.user ? (
              <>
                <BalanceButton />
                <UserDropdown user={session.user} />
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="bg-background flex-1">{children}</div>
    </div>
  );
}
