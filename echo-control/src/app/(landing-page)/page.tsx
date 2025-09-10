import { auth } from '@/auth';
import { Hero, Features, IntegrationSection, End } from './_components';
import { redirect } from 'next/navigation';
import { BillingSection } from './_components/4_billing';
import { UniversalBalanceSection } from './_components/5_universal_balance';

export default async function LandingPage() {
  if (await auth()) {
    return redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <End />
      <Hero />
      <Features />
      <IntegrationSection />
      <BillingSection />
      <UniversalBalanceSection />
      <End className="border-t" />
    </div>
  );
}
