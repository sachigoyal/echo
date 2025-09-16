import { Shield, Wrench } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminToolsBreadcrumb() {
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
        href="/admin/tools"
        image={null}
        name="Tools"
        Fallback={Wrench}
        disabled
      />
    </>
  );
}
