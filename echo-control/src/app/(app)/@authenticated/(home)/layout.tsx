import { Nav } from '../_components/layout/nav';

export default function AuthenticatedHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
        ]}
      />
      <div className="flex flex-col py-4 md:py-6">{children}</div>
    </>
  );
}
