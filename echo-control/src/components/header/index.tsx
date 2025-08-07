import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

import BalanceCard from '../BalanceCard';

import { UserDropdown } from './user-dropdown';
import { SignInButton } from './sign-in-button';

import { auth } from '@/auth';

export default async function Header() {
  const session = await auth();

  return (
    <header className="bg-card border-b shadow-sm sticky top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-2 md:px-4">
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
            <Link
              href="/owner/apps/create"
              className="hidden md:flex items-center px-4 py-2.5 text-sm font-medium text-foreground bg-background border border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-200 shadow-sm rounded-lg h-10"
            >
              Create App
            </Link>
            <BalanceCard compact />
            <UserDropdown user={session.user} />
          </>
        ) : (
          <SignInButton />
        )}
      </div>
    </header>
  );
}
