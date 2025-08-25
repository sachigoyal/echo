import { auth } from '@/auth';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

import { BalanceButton } from './_components/layout/header/balance';
import { UserDropdown } from './_components/layout/header/user-dropdown';
import { LogoContainer } from './_components/layout/logo';
import { Plus } from 'lucide-react';

export default async function AppLayout({
  children,
  breadcrumbs,
}: LayoutProps<'/'>) {
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
        <div className="flex items-center justify-between w-full px-2 md:px-6 pb-0 md:pb-0 h-10">
          <div className="pl-10 md:pl-12 flex items-center gap-2 md:gap-3">
            {breadcrumbs}
          </div>
          <div className="flex items-center gap-1 md:gap-3">
            <Link href="/new">
              <Button variant="outline" size="navbar">
                <Plus className="size-4" />
                <span className="hidden md:block">Create App</span>
              </Button>
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
