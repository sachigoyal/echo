import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navbar, Hero, Features, IntegrationSection, End } from './_components';

export default async function HomePage() {
  const session = await auth();

  if (session) {
    return redirect('/dashboard');
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <End />
        <Hero />
        <Features />
        <IntegrationSection />
        <End className="border-t" />
      </div>
    </div>
  );
}
