import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OwnerAppsPage from '@/components/OwnerAppsPage';

export default async function OwnerPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            App Owner Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your Echo applications, invite customers, and view analytics.
          </p>
        </div>
        <OwnerAppsPage />
      </div>
    </main>
  );
}
