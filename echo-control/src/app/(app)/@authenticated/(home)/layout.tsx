import { Nav } from '../_components/nav';

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
        ]}
      />
      <div className="flex flex-col gap-4 py-6">{children}</div>
    </>
  );
}
