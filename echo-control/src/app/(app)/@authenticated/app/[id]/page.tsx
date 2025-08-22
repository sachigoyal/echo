import { api } from '@/trpc/server';
import { HydrateClient } from '@/trpc/server';
import { notFound } from 'next/navigation';
import { Heading } from '../../_components/layout/page-utils';

export default async function AppPage({ params }: PageProps<'/app/[id]'>) {
  const { id } = await params;

  const app = await api.apps.public.get(id);

  if (!app) {
    return notFound();
  }

  return (
    <HydrateClient>
      <Heading title={app.name} description={app.description ?? undefined} />
    </HydrateClient>
  );
}
