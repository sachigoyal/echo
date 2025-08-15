import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { api } from '@/trpc/server';

interface AdminGuardProps {
  children: ReactNode;
  fallbackUrl?: string;
}

export async function AdminGuard({
  children,
  fallbackUrl = '/',
}: AdminGuardProps) {
  const isAdmin = await api.admin.isAdmin();

  if (!isAdmin) {
    redirect(fallbackUrl);
  }

  return <>{children}</>;
}
