import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { PermissionService } from '@/lib/permissions/service';
import { Permission } from '@/lib/permissions/types';
import OwnerAppDashboard from '@/components/OwnerAppDashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerAppDashboardPage({ params }: PageProps) {
  const { userId } = await auth();
  const { id: appId } = await params;

  if (!userId) {
    redirect('/sign-in');
  }

  // Get user from database
  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect('/sign-in');
  }

  // Check permissions
  const hasPermission = await PermissionService.hasPermission(
    user.id,
    appId,
    Permission.VIEW_ANALYTICS
  );

  if (!hasPermission) {
    redirect('/');
  }

  // Get app details
  const app = await db.echoApp.findUnique({
    where: { id: appId, isArchived: false },
    include: {
      _count: {
        select: {
          apiKeys: { where: { isArchived: false } },
          llmTransactions: { where: { isArchived: false } },
        },
      },
    },
  });

  if (!app) {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <OwnerAppDashboard appId={appId} appName={app.name} />
      </div>
    </main>
  );
}
