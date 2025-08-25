import { Nav } from '../_components/layout/nav';

export default async function AuthenticatedHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Nav
        tabs={[
          {
            label: 'Overview',
            href: '/',
          },
          {
            label: 'Credits',
            href: '/credits',
          },
          {
            label: 'API Keys',
            href: '/keys',
          },
          {
            label: 'Create',
            href: '/new',
          },
        ]}
      />
      <div className="flex flex-col py-4 md:py-6">{children}</div>
    </div>
  );
}
