import { Shield } from 'lucide-react';
import { Breadcrumb } from '@/app/(app)/@breadcrumbs/_components/breadcrumb';

export default function AdminBreadcrumb() {
  return (
    <Breadcrumb
      href="/admin"
      image={null}
      name="Admin"
      Fallback={Shield}
      disabled
    />
  );
}
