import { auth } from '@/auth';

import { Logo } from '@/components/ui/logo';

import { BalanceButton } from './_components/layout/header/balance';
import { UserDropdown } from './_components/layout/header/user-dropdown';
import { LogoContainer } from './_components/layout/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Route } from 'next';
import { Book } from 'lucide-react';

export default async function AppLayout({
  children,
  breadcrumbs,
}: LayoutProps<'/'>) {
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
          <div className="flex items-center gap-1 md:gap-2">
            <BalanceButton />
            <Link href={'/docs' as Route<'/docs'>}>
              <Button variant="outline" size="navbar">
                <Book className="size-4" />
                <span className="hidden md:block">Docs</span>
              </Button>
            </Link>
            <UserDropdown />
          </div>
        </div>
      </header>
      <div className="bg-background flex-1">{children}</div>
    </div>
  );
}
