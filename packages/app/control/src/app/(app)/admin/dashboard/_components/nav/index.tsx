import Link from 'next/link';

import { DashboardNavButton } from './button';

import type { Route } from 'next';

export const DashboardNav: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-2">
      <DashboardNavLink href="/admin/dashboard/user-earnings">
        User Earnings
      </DashboardNavLink>
      <DashboardNavLink href="/admin/dashboard/user-spending">
        User Spending
      </DashboardNavLink>
      <DashboardNavLink href="/admin/dashboard/app-earnings">
        App Earnings
      </DashboardNavLink>
      <DashboardNavLink href="/admin/dashboard/payments">
        Payment History
      </DashboardNavLink>
    </div>
  );
};

interface NavLinkProps<T extends string> {
  href: Route<T>;
  children: React.ReactNode;
}

const DashboardNavLink = <T extends string>({
  href,
  children,
}: NavLinkProps<T>) => {
  return (
    <Link href={href}>
      <DashboardNavButton href={href}>{children}</DashboardNavButton>
    </Link>
  );
};
