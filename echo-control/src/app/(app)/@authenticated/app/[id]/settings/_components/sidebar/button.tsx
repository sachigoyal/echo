'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Route } from 'next';
import { usePathname } from 'next/navigation';

interface Props<T extends string> {
  children: React.ReactNode;
  href: Route<T>;
}

export const AppSettingsSidebarButton = <T extends string>({
  children,
  href,
}: Props<T>) => {
  const pathname = usePathname();

  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start',
        pathname === href ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {children}
    </Button>
  );
};
