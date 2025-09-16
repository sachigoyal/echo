import { Shield, User, Smartphone } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

interface UserAppsBreadcrumbProps {
  params: Promise<{
    userId: string
  }>
}

export default async function AdminDashboardV2UserAppsBreadcrumb({ params }: UserAppsBreadcrumbProps) {
  const { userId } = await params
  
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
        name="Users"
        Fallback={User}
        mobileHideText
      />
      <span className="text-muted-foreground">/</span>
      <Breadcrumb
        href={`/admin/dashboard/v2/user-apps/${userId}`}
        image={null}
        name="User Apps"
        Fallback={Smartphone}
        disabled
      />
    </>
  );
}
