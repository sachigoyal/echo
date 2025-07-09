import { Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AppRole } from '@/lib/permissions/types';
import { DetailedEchoApp } from '@/hooks/useEchoAppDetail';
import {
  AppDetailLayout,
  AppBanner,
  AppProfile,
  ActivityChart,
} from './AppDetailShared';

interface PublicAppDetailProps {
  app: DetailedEchoApp;
}

export function PublicAppDetail({ app }: PublicAppDetailProps) {
  const basicStats = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Owner Information */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Owner</p>
        <p className="text-sm text-foreground font-medium truncate">
          {app.user?.name || app.user?.email || 'Unknown'}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Created
        </p>
        <p className="text-sm text-foreground font-medium">
          {new Date(app.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
        <Badge variant={app.isActive ? 'default' : 'secondary'}>
          {app.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Requests Served
        </p>
        <p className="text-lg font-bold text-foreground">
          {app.stats?.totalTransactions?.toLocaleString() || '0'}
        </p>
      </div>
    </div>
  );

  const callToAction = (
    <div className="flex items-center gap-4">
      <Link href="/sign-in">
        <Button size="default">
          <Shield className="h-4 w-4" />
          Sign In to Access
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button variant="outline" size="default">
          <Users className="h-4 w-4" />
          Create Account
        </Button>
      </Link>
    </div>
  );

  const publicNotice = (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
      <p className="text-sm text-muted-foreground">
        <Shield className="h-4 w-4 inline mr-2" />
        This is a public application preview. Sign in to access full features,
        create API keys, and view detailed analytics.
      </p>
    </div>
  );

  return (
    <AppDetailLayout>
      <div className="relative z-10">
        <AppBanner app={app} />

        <AppProfile
          app={app}
          userRole={AppRole.PUBLIC}
          roleLabel="Public App"
          actions={
            <div>
              {callToAction}
              {publicNotice}
            </div>
          }
        >
          {basicStats}
        </AppProfile>
      </div>

      {/* Activity Chart for Public Users */}
      <div className="px-6 mt-8 mb-8">
        <ActivityChart app={app} />
      </div>
    </AppDetailLayout>
  );
}
