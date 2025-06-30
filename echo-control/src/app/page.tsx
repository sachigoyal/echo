import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CustomerAppsPage from '@/components/CustomerAppsPage';

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            My Applications
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Your AI applications with seamless authentication and payments
          </p>
        </div>
        <CustomerAppsPage />
      </div>
    </main>
  );
}
