import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const SignInButton = () => {
  return (
    <Link href="/login">
      <Button variant="outline" className="h-8 md:h-9">
        <span>Sign In</span>
      </Button>
    </Link>
  );
};
