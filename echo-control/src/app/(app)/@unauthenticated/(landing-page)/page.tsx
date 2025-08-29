import { auth } from '@/auth';
import { Hero, Features, IntegrationSection, End } from './_components';

export default async function LandingPage() {
  if (await auth()) {
    return null;
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
