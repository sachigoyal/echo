'use client';

import { SignOutButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { GlassButton } from '@/components/glass-button';

export default function SignOutPage() {
  const { user } = useUser();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive rounded-2xl mb-4">
              <svg
                className="w-8 h-8 text-destructive-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sign Out</h1>
          <p className="text-muted-foreground">
            {user
              ? `Goodbye, ${user.firstName || user.emailAddresses[0]?.emailAddress}!`
              : 'Come back soon!'}
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-lg">
          <div className="text-center space-y-6">
            <p className="text-muted-foreground">
              Are you sure you want to sign out of Echo Control Plane?
            </p>

            <div className="space-y-4">
              <SignOutButton redirectUrl="/sign-in">
                <GlassButton className="w-full" variant="primary">
                  Sign Out
                </GlassButton>
              </SignOutButton>

              <Link
                href="/"
                className="block w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-4 rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Need to switch accounts?{' '}
            <Link
              href="/sign-in"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
