import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const SignInButton = () => {
  return (
    <Link href="/login">
      <Button variant="outline">
        <span>Sign In</span>
      </Button>
    </Link>
  );
};
