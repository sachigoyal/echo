import { Shield, CreditCard } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminPayoutsBreadcrumb() {
  return (
    <>
      <Breadcrumb
        href="/admin/dashboard"
        image={null}
        name="Admin"
        Fallback={Shield}
        mobileHideText
      />
      <span className="text-muted-foreground">/</span>
      <Breadcrumb
        href="/admin/payouts"
        image={null}
        name="Payouts"
        Fallback={CreditCard}
        disabled
      />
    </>
  );
}
