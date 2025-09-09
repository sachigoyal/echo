import { Nav } from '../_components/layout/nav';

export default function EarningsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Nav
        tabs={[
          {
            label: 'Creator Earnings',
            href: '/earnings/creator',
          },
          {
            label: 'Referral Earnings',
            href: '/earnings/referral',
          },
        ]}
      />
      <div className="flex flex-col py-6 md:py-8">{children}</div>
    </div>
  );
}
