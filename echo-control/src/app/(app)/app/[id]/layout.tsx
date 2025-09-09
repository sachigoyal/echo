import { Nav } from '../../_components/layout/nav';
import { getApp, getIsOwner } from './_lib/fetch';

import type { Metadata } from 'next';
import { auth } from '@/auth';

export async function generateMetadata({
  params,
}: PageProps<'/app/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const app = await getApp(id);
  return {
    title: {
      default: app.name,
      template: `${app.name} | %s | Echo`,
    },
    description: app.description || undefined,
  };
}

export default async function AuthenticatedAppLayout({
  children,
  params,
}: LayoutProps<'/app/[id]'>) {
  const { id } = await params;

  const session = await auth();

  const isOwner = session?.user ? await getIsOwner(id) : false;

  return (
    <div>
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: `/app/${id}`,
          },
          ...(isOwner
            ? [
                {
                  label: 'Free Tier',
                  href: `/app/${id}/free-tier` as const,
                },
              ]
            : []),
          {
            label: 'Referrals',
            href: `/app/${id}/referrals`,
          },
          {
            label: 'Keys',
            href: `/app/${id}/keys`,
          },
          {
            label: 'Users',
            href: `/app/${id}/users`,
          },
          {
            label: 'Transactions',
            href: `/app/${id}/transactions`,
          },
          ...(isOwner
            ? [
                {
                  label: 'Settings',
                  href: `/app/${id}/settings` as const,
                  subRoutes: [
                    `/app/${id}/settings/general`,
                    `/app/${id}/settings/monetization`,
                    `/app/${id}/settings/security`,
                  ],
                },
              ]
            : []),
        ]}
      />
      <div className="flex flex-col py-6 md:py-8">{children}</div>
    </div>
  );
}
