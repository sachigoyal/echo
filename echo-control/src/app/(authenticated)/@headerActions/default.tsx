import { Actions } from '../_components/nav';

export default function DefaultHeaderActions() {
  return (
    <Actions
      tabs={[
        {
          label: 'Apps',
          href: '/dashboard',
        },
        {
          label: 'Settings',
          href: '/settings',
        },
      ]}
    />
  );
}
