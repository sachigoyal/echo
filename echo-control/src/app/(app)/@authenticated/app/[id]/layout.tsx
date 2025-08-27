import { Nav } from '../../_components/layout/nav';

export default async function AuthenticatedAppLayout({
  children,
  params,
}: LayoutProps<'/app/[id]'>) {
  const { id } = await params;

  return (
    <div>
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: `/app/${id}`,
          },
          {
            label: 'Free Tier',
            href: `/app/${id}/free-tier`,
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
          {
            label: 'Settings',
            href: `/app/${id}/settings`,
            subRoutes: [
              `/app/${id}/settings/general`,
              `/app/${id}/settings/monetization`,
              `/app/${id}/settings/security`,
            ],
          },
        ]}
      />
      <div className="flex flex-col py-4 md:py-6">{children}</div>
    </div>
  );
}
