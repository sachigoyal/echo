import { Hero, Features, IntegrationSection, End } from './_components';

export default async function LandingPage() {
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
