import EchoAppDetail from '@/components/EchoAppDetail'

interface PageProps {
  params: { id: string }
}

export default function EchoAppPage({ params }: PageProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <EchoAppDetail appId={params.id} />
      </div>
    </main>
  )
} 