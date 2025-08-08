'use client';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';

export const SignInButton = () => {
  const pathname = usePathname();

  if (pathname.includes('/login')) {
    return null;
  }

  return (
    <Link href="/login">
      <Button variant="outline" className="h-8 md:h-9">
        <span>Sign In</span>
      </Button>
    </Link>
  );
};
