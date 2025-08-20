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
            label: 'Popular',
            href: '/popular',
          },
        ]}
      />
      {children}
    </>
  );
}
