import { Shield, TrendingUp } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminDashboardV2UserEarningsBreadcrumb() {
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
        href="/admin/dashboard/v2/user-earnings"
        image={null}
        name="User Earnings"
        Fallback={TrendingUp}
        disabled
      />
    </>
  );
}
