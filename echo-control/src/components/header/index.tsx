import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

import BalanceCard from '../BalanceCard';
import { UserDropdown } from './user-dropdown';

import { auth } from '@/auth';
import { SignInButton } from './sign-in-button';

export default async function Header() {
  const session = await auth();

  return (
    <header className="bg-card border-b border-border shadow-sm backdrop-blur-sm relative z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left side */}
          <div className="font-bold flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Logo className="h-8 w-auto" />
            </Link>
            <span className="text-sm md:text-lg">
              <span className="font-extrabold">Echo</span>
              <span className="font-extralight"> by MeritSystems</span>
            </span>
          </div>

          {/* User controls - Right side */}
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
        </div>
      </div>
    </header>
  );
}
