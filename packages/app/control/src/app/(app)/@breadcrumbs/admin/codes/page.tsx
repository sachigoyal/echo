import { Shield, Ticket } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminCodesBreadcrumb() {
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
        href="/admin/codes"
        image={null}
        name="Credit Grants"
        Fallback={Ticket}
        disabled
      />
    </>
  );
}
