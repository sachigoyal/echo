import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const SignInButton = () => {
  return (
    <Link href="/sign-in">
      <Button variant="outline">
        <span>Sign In</span>
      </Button>
    </Link>
  );
};
