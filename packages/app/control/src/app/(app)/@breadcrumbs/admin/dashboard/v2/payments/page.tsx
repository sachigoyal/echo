import { Shield, CreditCard } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminDashboardV2PaymentsBreadcrumb() {
  return (
    <>
      <Breadcrumb
        href="/admin"
        image={null}
        name="Admin"
        Fallback={Shield}
        mobileHideText
      />
      <span className="text-muted-foreground">/</span>
      <Breadcrumb
        href="/admin/dashboard/v2/payments"
        image={null}
        name="Payment History"
        Fallback={CreditCard}
        disabled
      />
    </>
  );
}
