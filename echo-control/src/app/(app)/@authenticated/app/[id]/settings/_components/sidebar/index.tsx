import Link from 'next/link';

import { AppSettingsSidebarButton } from './button';

import type { Route } from 'next';

interface Props {
  appId: string;
}

export const AppSettingsSidebar: React.FC<Props> = ({ appId }) => {
  return (
    <div className="sticky top-0 hidden lg:block w-[240px]">
      <SidebarLink href={`/app/${appId}/settings`}>General</SidebarLink>
    </div>
  );
};

interface SidebarLinkProps<T extends string> {
  href: Route<T>;
  children: React.ReactNode;
}

const SidebarLink = <T extends string>({
  href,
  children,
}: SidebarLinkProps<T>) => {
  return (
    <Link href={href}>
      <AppSettingsSidebarButton href={href}>
        {children}
      </AppSettingsSidebarButton>
    </Link>
  );
};
