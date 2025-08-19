import EchoAppDetail from '@/components/EchoAppDetail';
import { api } from '@/trpc/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const app = await api.apps.public.get(id);

  return <div>{app.name}</div>;
}
