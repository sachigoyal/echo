import { Shield, Building2 } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminDashboardV2AppEarningsBreadcrumb() {
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
        href="/admin/dashboard/v2/app-earnings"
        image={null}
        name="App Earnings"
        Fallback={Building2}
        disabled
      />
    </>
  );
}
