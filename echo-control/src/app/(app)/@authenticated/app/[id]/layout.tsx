import { Nav } from '../../_components/nav';

export default async function AuthenticatedAppLayout({
  children,
  params,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;

  return (
    <>
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: `/app/${id}`,
          },
          {
            label: 'Settings',
            href: `/app/${id}/settings`,
          },
        ]}
      />
      {children}
    </>
  );
}
