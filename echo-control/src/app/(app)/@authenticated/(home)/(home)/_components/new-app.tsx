import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { api } from '@/trpc/server';

export const NewAppButton = async () => {
  const numApps = await api.apps.count.owner();

  if (numApps === 0) {
    return null;
  }

  return (
    <Link href="/new">
      <Button variant="turbo">New App</Button>
    </Link>
  );
};
