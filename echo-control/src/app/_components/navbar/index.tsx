import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

import { BalanceButton } from './balance';

import { UserDropdown } from './user-dropdown';
import { SignInButton } from './sign-in-button';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';

export const Navbar = async () => {
  const session = await auth();

  return (
    <header className="bg-card border-b border-border/50 shadow-xs fixed top-0 left-0 right-0 z-50 h-12 md:h-16 flex items-center justify-between px-2 md:px-4">
      <div className="font-bold flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-sm md:text-lg">
            <span className="font-extrabold">Echo</span>
            <span className="font-extralight"> by MeritSystems</span>
          </span>
        </Link>
      </div>
      <div className="flex items-center space-x-3">
        {session?.user ? (
          <>
            <Link href="/owner/apps/create">
              <Button variant="outline">Create App</Button>
            </Link>
            <BalanceButton />
            <UserDropdown user={session.user} />
          </>
        ) : (
          <SignInButton />
        )}
      </div>
    </header>
  );
};
