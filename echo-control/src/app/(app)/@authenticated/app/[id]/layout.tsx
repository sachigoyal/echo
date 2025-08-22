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
            label: 'Keys',
            href: `/app/${id}/keys`,
          },
          {
            label: 'Settings',
            href: `/app/${id}/settings`,
          },
        ]}
      />
      <div className="flex flex-col py-4 md:py-6">{children}</div>
    </div>
  );
}
