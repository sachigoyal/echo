import { Shield, Users, Smartphone } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

interface AppUsersBreadcrumbProps {
  params: {
    appId: string
  }
}

export default function AdminDashboardV2AppUsersBreadcrumb({ params }: AppUsersBreadcrumbProps) {
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
        name="Apps"
        Fallback={Smartphone}
        mobileHideText
      />
      <span className="text-muted-foreground">/</span>
      <Breadcrumb
        href={`/admin/dashboard/v2/app-users/${params.appId}`}
        image={null}
        name="App Users"
        Fallback={Users}
        disabled
      />
    </>
  );
}
