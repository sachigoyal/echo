import {
  FileText,
  Laptop,
  LogOut,
  Moon,
  Sun,
  User,
  UserLock,
  Users,
} from 'lucide-react';

import Link from 'next/link';

import { signOut } from 'next-auth/react';

import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/skeleton';
import { MinimalGithubAvatar } from '@/components/ui/minimalGithubAvatar';

import { useUser } from '@/hooks/use-user';

import { cn } from '@/lib/utils';

export function UserDropdown() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();

  if (!isLoaded) {
    return <Skeleton className="h-10 w-10 rounded-lg border shrink-0" />;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger>
        <MinimalGithubAvatar
          srcUrl={user?.image || ''}
          alt={user?.name || ''}
          className="h-10 w-10 rounded-lg border"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <MinimalGithubAvatar
              srcUrl={user?.image || ''}
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
          <div className="flex items-center  gap-2 text-left text-sm">
            {[
              { theme: 'light' as const, Icon: Sun },
              { theme: 'dark' as const, Icon: Moon },
              { theme: 'system' as const, Icon: Laptop },
            ].map(({ theme: themeOption, Icon }) => (
              <Button
                key={themeOption}
                variant="ghost"
                onClick={() => setTheme(themeOption)}
                className={cn(
                  'size-fit p-1 hover:bg-foreground/10',
                  theme === themeOption &&
                    'bg-foreground/10 hover:bg-foreground/20'
                )}
              >
                <Icon className="size-4" />
              </Button>
            ))}
          </div>
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
        <DropdownMenuItem onClick={() => signOut({ redirectTo: '/sign-in' })}>
          <LogOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
