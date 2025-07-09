import { Key, CreditCard, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppRole, Permission } from '@/lib/permissions/types';
import { DetailedEchoApp } from '@/hooks/useEchoAppDetail';
import { formatCurrency } from '@/lib/balance';
import {
  AppDetailLayout,
  AppBanner,
  AppProfile,
  ActivityChart,
  ApiKeysCard,
  RecentActivityCard,
  formatNumber,
} from './AppDetailShared';

interface CustomerAppDetailProps {
  app: DetailedEchoApp;
  hasPermission: (permission: Permission) => boolean;
  onCreateApiKey?: () => void;
  onArchiveApiKey?: (id: string) => void;
  deletingKeyId?: string | null;
  showPaymentSuccess?: boolean;
  onDismissPaymentSuccess?: () => void;
}

export function CustomerAppDetail({
  app,
  hasPermission,
  onCreateApiKey,
  onArchiveApiKey,
  deletingKeyId,
  showPaymentSuccess,
  onDismissPaymentSuccess,
}: CustomerAppDetailProps) {
  const customerStats = (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      {/* Owner Information */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Owner</p>
        <p className="text-sm text-foreground font-medium truncate">
          {app.user?.name || app.user?.email || 'Unknown'}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Your Requests
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatNumber(app.stats?.totalTransactions)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Your Tokens
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatNumber(app.stats?.totalTokens)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Your Spending
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(app.stats?.totalCost)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Your API Keys
        </p>
        <p className="text-lg font-bold text-foreground">
          {app.apiKeys?.length || 0}
        </p>
      </div>
    </div>
  );

  const customerActions = (
    <div className="flex items-center gap-3">
      {hasPermission(Permission.MANAGE_OWN_API_KEYS) && onCreateApiKey && (
        <Button onClick={onCreateApiKey} size="default" variant="default">
          <Key className="h-4 w-4" />
          Create API Key
        </Button>
      )}
      <Link href="/credits">
        <Button size="default" variant="outline">
          <CreditCard className="h-4 w-4" />
          Add Credits
        </Button>
      </Link>
    </div>
  );

  return (
    <AppDetailLayout
      showPaymentSuccess={showPaymentSuccess}
      onDismissPaymentSuccess={onDismissPaymentSuccess}
    >
      <div className="relative z-10">
        <AppBanner app={app} />

        <AppProfile
          app={app}
          userRole={AppRole.CUSTOMER}
          roleLabel="Customer Access"
          actions={customerActions}
        >
          {customerStats}
        </AppProfile>
      </div>

      {/* Customer Data Cards Section */}
      <div className="px-6 mt-8 mb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Keys Card */}
          <ApiKeysCard
            app={app}
            hasCreatePermission={hasPermission(Permission.MANAGE_OWN_API_KEYS)}
            hasManagePermission={hasPermission(Permission.MANAGE_OWN_API_KEYS)}
            onCreateApiKey={onCreateApiKey}
            onArchiveApiKey={onArchiveApiKey}
            deletingKeyId={deletingKeyId}
          />

          {/* Recent Activity Card */}
          <RecentActivityCard app={app} title="Your Recent Activity" />
        </div>
      </div>

      {/* Activity Chart for Customer Users */}
      <div className="px-6 mt-8 mb-8">
        <ActivityChart app={app} title="Your Activity" />
      </div>
    </AppDetailLayout>
  );
}
