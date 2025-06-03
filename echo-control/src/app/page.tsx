import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import EchoAppsDashboard from '@/components/EchoAppsDashboard'

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Echo Control Plane</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your Echo applications, API keys, and usage analytics.
          </p>
        </div>
        <EchoAppsDashboard />
      </div>
    </main>
  )
}
