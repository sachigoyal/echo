'use client';

import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../theme-provider';
import BalanceCard from '../BalanceCard';
import { UserDropdown } from './user-dropdown';
import { Logo } from '../ui/logo';

export default function Header() {
  const { user, isLoaded } = useUser();
  const { resolvedTheme } = useTheme();

  if (!isLoaded) {
    return (
      <header className="bg-card border-b border-border shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo placeholder */}
            <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
            {/* User menu placeholder */}
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
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
              {/* Create App Button */}
              {user && (
                <Link
                  href="/owner/apps/create"
                  className="hidden md:flex items-center px-4 py-2.5 text-sm font-medium text-foreground bg-background border border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-200 shadow-sm rounded-lg h-10"
                >
                  Create App
                </Link>
              )}
              {/* Balance Card - Compact */}
              {user && <BalanceCard compact />}
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
