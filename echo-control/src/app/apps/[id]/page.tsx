import EchoAppDetail from '@/components/EchoAppDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EchoAppPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <EchoAppDetail appId={id} />
      </div>
    </main>
  );
}
