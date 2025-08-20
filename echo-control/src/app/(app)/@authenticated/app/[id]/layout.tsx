import { Nav } from '../../_components/layout/nav';

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
      <div className="flex flex-col py-4 md:py-6">{children}</div>
    </>
  );
}
