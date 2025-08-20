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
            label: 'Home',
            href: '/',
          },
          {
            label: 'Credits',
            href: '/credits',
          },
          {
            label: 'Keys',
            href: '/keys',
          },
        ]}
      />
      <div className="flex flex-col py-4 md:py-6">{children}</div>
    </>
  );
}
