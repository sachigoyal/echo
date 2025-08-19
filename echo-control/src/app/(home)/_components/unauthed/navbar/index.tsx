import Link from 'next/link';

import { Logo } from '@/components/ui/logo';

import { Button } from '@/components/ui/button';

export const Navbar = () => {
  return (
    <header className="border-b border-border/50 bg-background sticky top-0 left-0 right-0 z-50 p-2 md:p-4">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-8" />
          <div className="flex flex-col gap-1">
            <span className="font-extrabold text-xl leading-none">Echo</span>
            <span className="text-[10px] font-extralight leading-none">
              by <span className="font-medium">Merit</span>Systems
            </span>
          </div>
        </Link>
        <div className="flex items-center space-x-3">
          <Link href="/login">
            <Button variant="outline" className="h-8 md:h-9">
              <span>Sign In</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
