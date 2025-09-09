import { auth } from '@/auth';
import { Hero, Features, IntegrationSection, End } from './_components';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  if (await auth()) {
    return redirect('/');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <End />
      <Hero />
      <Features />
      <IntegrationSection />
      <End className="border-t" />
    </div>
  );
}
