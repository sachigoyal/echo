import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppRole, Permission } from '@/lib/permissions/types';
import { OwnerEchoApp } from '@/lib/apps/types';
import { formatCurrency } from '@/lib/balance';
import { Switch } from '@/components/ui/switch';
import {
  AppDetailLayout,
  AppBanner,
  AppProfile,
  ActivityChart,
  TopModelsCard,
  formatNumber,
} from './AppDetailShared';
import { OwnerApiKeysCard } from './ApiKeyDetail';
import { OwnerRecentActivityCard } from './RecentActivityDetail';
import { AppHomepageCard } from './AppHomepageCard';

interface OwnerAppDetailProps {
  app: OwnerEchoApp;
  hasPermission: (permission: Permission) => boolean;
  onCreateApiKey?: () => void;
  onArchiveApiKey?: (id: string) => void;
  deletingKeyId?: string | null;
  showPaymentSuccess?: boolean;
  onDismissPaymentSuccess?: () => void;
}

export function OwnerAppDetail({
  app,
  hasPermission,
  onCreateApiKey,
  onArchiveApiKey,
  deletingKeyId,
  showPaymentSuccess,
  onDismissPaymentSuccess,
}: OwnerAppDetailProps) {
  // View toggle state - 0 for personal, 1 for global
  const [viewMode, setViewMode] = useState([1]);
  const isGlobalView = viewMode[0] === 1;

  // Clean stats display with slider in bottom right
  const enhancedStats = (
    <div className="relative">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {/* Owner Information */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Owner
          </p>
          <p className="text-sm text-foreground font-medium truncate">
            {app.owner?.name || app.owner?.email || 'Unknown'}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {isGlobalView ? 'Total Requests' : 'Your Requests'}
          </p>
          <p className="text-lg font-bold text-foreground">
            {formatNumber(
              isGlobalView
                ? app.stats?.globalTotalTransactions
                : app.stats?.personalRecentTransactions?.length || 0
            )}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {isGlobalView ? 'Total Tokens' : 'Your Tokens'}
          </p>
          <p className="text-lg font-bold text-foreground">
            {formatNumber(
              isGlobalView
                ? app.stats?.globalTotalTokens
                : app.stats?.personalTotalTokens
            )}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {isGlobalView ? 'Total Spending' : 'Your Spending'}
          </p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(
              isGlobalView
                ? app.stats?.globalTotalRevenue
                : app.stats?.personalTotalRevenue
            )}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Your API Keys
          </p>
          <p className="text-lg font-bold text-foreground">
            {app.stats?.globalApiKeys?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );

  const enhancedActions = (
    <div className="flex items-center gap-3">
      <Link href={`/owner/${app.id}/settings`}>
        <Button size="default" variant="outline">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </Link>
      <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground">
          Personal
        </span>
        <div className="w-12">
          <Switch
            checked={isGlobalView}
            onCheckedChange={checked => setViewMode([checked ? 1 : 0])}
            className="cursor-pointer"
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Global
        </span>
      </div>
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
          userRole={AppRole.OWNER}
          roleLabel="Owner Access"
          actions={enhancedActions}
        >
          {enhancedStats}
        </AppProfile>
      </div>

      {/* Tokens Over Time Chart - Full Width */}
      <div className="px-6 mb-32 relative z-10">
        <div className="h-64">
          <ActivityChart
            app={app}
            title={
              isGlobalView ? 'Global Tokens Over Time' : 'Your Tokens Over Time'
            }
          />
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="px-6 mt-8 mb-8 relative z-10">
        {/* First Row - Homepage and API Keys */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Homepage Card */}
          <AppHomepageCard app={app} />

          {/* API Keys Card */}
          <OwnerApiKeysCard
            app={app}
            hasCreatePermission={hasPermission(Permission.CREATE_API_KEYS)}
            hasManagePermission={hasPermission(Permission.MANAGE_ALL_API_KEYS)}
            onCreateApiKey={onCreateApiKey}
            onArchiveApiKey={onArchiveApiKey}
            deletingKeyId={deletingKeyId}
          />
        </div>

        {/* Second Row - Activity and Recent Transactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Activity Card */}
          <OwnerRecentActivityCard
            app={app}
            title={
              isGlobalView ? 'Global Recent Activity' : 'Your Recent Activity'
            }
            isGlobalView={isGlobalView}
          />

          {/* Models Usage Card */}
          <TopModelsCard
            app={app}
            title={isGlobalView ? 'Global Model Usage' : 'Your Model Usage'}
          />
        </div>
      </div>
    </AppDetailLayout>
  );
}
