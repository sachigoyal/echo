import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

import { BalanceButton } from './balance';

import { UserDropdown } from './user-dropdown';

import type { User } from 'next-auth';

interface Props {
  user: User;
}

export const Header: React.FC<Props> = ({ user }) => {
  return (
    <header className="flex items-center justify-between p-2 md:p-4">
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
        <Link href="/apps/create">
          <Button variant="outline">Create App</Button>
        </Link>
        <BalanceButton />
        <UserDropdown user={user} />
      </div>
    </header>
  );
};
