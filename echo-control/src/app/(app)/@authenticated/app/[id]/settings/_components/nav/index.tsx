import Link from 'next/link';

import { AppSettingsSidebarButton } from './button';

import type { Route } from 'next';

interface Props {
  appId: string;
}

export const SettingsNav: React.FC<Props> = ({ appId }) => {
  return (
    <div className="w-full">
      <SettingsNavLink href={`/app/${appId}/settings/general`} appId={appId}>
        General
      </SettingsNavLink>
    </div>
  );
};

interface SidebarLinkProps<T extends string> {
  href: Route<T>;
  children: React.ReactNode;
  appId: string;
}

const SettingsNavLink = <T extends string>({
  href,
  children,
  appId,
}: SidebarLinkProps<T>) => {
  return (
    <Link href={href}>
      <AppSettingsSidebarButton href={href} appId={appId}>
        {children}
      </AppSettingsSidebarButton>
    </Link>
  );
};
