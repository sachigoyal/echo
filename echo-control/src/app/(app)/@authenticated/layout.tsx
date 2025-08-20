import { auth } from '@/auth';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

import { BalanceButton } from './_components/layout/header/balance';
import { UserDropdown } from './_components/layout/header/user-dropdown';
import { LogoContainer } from './_components/layout/logo';

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
      <header className="w-full flex flex-col pt-4 justify-center">
        <div className="flex items-center justify-between w-full px-2 md:px-6 pb-0 md:pb-0">
          <div className="pl-12 flex items-center gap-3">{breadcrumbs}</div>
          <div className="flex items-center space-x-3">
            <Link href="/new">
              <Button variant="outline">Create App</Button>
            </Link>
            <BalanceButton />
            <UserDropdown user={session.user} />
          </div>
        </div>
      </header>
      <div className="bg-background flex-1">{children}</div>
    </div>
  );
}
