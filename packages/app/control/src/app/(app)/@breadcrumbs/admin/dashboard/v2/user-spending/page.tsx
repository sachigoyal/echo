import { Shield, Users } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminDashboardV2UserSpendingBreadcrumb() {
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
        href="/admin/dashboard/v2/user-spending"
        image={null}
        name="User Spending"
        Fallback={Users}
        disabled
      />
    </>
  );
}
