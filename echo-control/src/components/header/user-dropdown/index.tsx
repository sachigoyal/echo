import React from 'react';

import { FileText, LogOut, User, UserLock, Users } from 'lucide-react';

import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ColorModeToggle } from './color-mode-toggle';

import type { User as NextAuthUser } from 'next-auth';
import { signOut } from '@/auth';

interface Props {
  user: NextAuthUser;
}

export const UserDropdown: React.FC<Props> = ({ user }) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <img
          src={user?.image || ''}
          alt={user?.name || ''}
          className="h-10 w-10 rounded-lg border"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <img
              src={user?.image || ''}
              alt={user?.name || ''}
              className="size-9 rounded-lg"
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user?.name}</span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href={`/apps/my-apps`}>
            <DropdownMenuItem>
              <User className="size-4" />
              My Apps
            </DropdownMenuItem>
          </Link>
          <Link href={`/apps/member-apps`}>
            <DropdownMenuItem>
              <Users className="size-4" />
              Apps I&apos;m Using
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex gap-2">
          <DropdownMenuLabel className="font-normal">Theme</DropdownMenuLabel>
          <ColorModeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a
              href="https://merit.systems/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <UserLock className="size-4" />
              Privacy Policy
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href="https://merit.systems/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="size-4" />
              Terms of Service
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              Sign Out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
