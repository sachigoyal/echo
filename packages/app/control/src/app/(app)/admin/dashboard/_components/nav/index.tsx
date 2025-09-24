import Link from 'next/link';

import { DashboardNavButton } from './button';

import type { Route } from 'next';

export const DashboardNav: React.FC = () => {
  return (
    <>
      {/* Mobile horizontal scrollable nav */}
      <div className="lg:hidden w-full overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-1">
          <DashboardNavLink href="/admin/dashboard">Home</DashboardNavLink>
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
      </div>

      {/* Desktop vertical nav */}
      <div className="hidden lg:flex w-full flex-col gap-2">
        <DashboardNavLink href="/admin/dashboard">Home</DashboardNavLink>
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
    </>
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
