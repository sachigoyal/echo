import { Key, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppRole, Permission } from '@/lib/permissions/types';
import { DetailedEchoApp } from '@/hooks/useEchoAppDetail';
import { formatCurrency } from '@/lib/balance';
import { githubApi, GitHubRepo, GitHubUser } from '@/lib/github-api';
import {
  AppDetailLayout,
  AppBanner,
  AppProfile,
  ActivityChart,
  TopModelsCard,
  OverviewStats,
  ApiKeysCard,
  RecentActivityCard,
  formatNumber,
} from './AppDetailShared';

interface OwnerAppDetailProps {
  app: DetailedEchoApp;
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
  const [githubData, setGithubData] = useState<GitHubUser | GitHubRepo | null>(
    null
  );

  useEffect(() => {
    const fetchGithubData = async () => {
      if (app?.githubId && app?.githubType) {
        setGithubData(null);
        let data = null;
        if (app.githubType === 'user') {
          data = await githubApi.verifyUserById(app.githubId);
        } else if (app.githubType === 'repo') {
          data = await githubApi.verifyRepoById(app.githubId);
        }
        setGithubData(data);
      }
    };
    fetchGithubData();
  }, [app?.githubId, app?.githubType]);

  const getRoleLabel = () => {
    if (hasPermission(Permission.EDIT_APP)) {
      return app.user?.id ? 'Owner' : 'Administrator';
    }
    return 'Full Access';
  };

  const ownerStats = (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      {/* Basic Info */}
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

      {/* Owner Details */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Owner</p>
        <p className="text-sm text-foreground font-medium truncate">
          {app.user?.name || app.user?.email || 'Unknown'}
        </p>
      </div>

      {/* Usage Stats */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Total Requests
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatNumber(app.stats?.totalTransactions)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Total Tokens
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatNumber(app.stats?.totalTokens)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Total Spent
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(app.stats?.totalCost)}
        </p>
      </div>
    </div>
  );

  const githubSection = githubData && (
    <div className="bg-muted/30 p-3 rounded-lg">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Linked GitHub Account
      </p>
      <a
        href={githubData.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 text-sm text-foreground font-medium hover:underline"
      >
        <Image
          src={
            app?.githubType === 'user'
              ? (githubData as GitHubUser).avatar_url
              : (githubData as GitHubRepo).owner.avatar_url
          }
          alt="avatar"
          width={32}
          height={32}
          className="w-8 h-8 rounded-full"
        />
        <span className="truncate">
          {app?.githubType === 'user'
            ? (githubData as GitHubUser).login
            : (githubData as GitHubRepo).full_name}
        </span>
      </a>
    </div>
  );

  const ownerActions = (
    <div className="flex items-center justify-between">
      {/* Primary Actions */}
      <div className="flex gap-3">
        {hasPermission(Permission.CREATE_API_KEYS) && onCreateApiKey && (
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

      {/* Secondary Actions */}
      <div className="flex gap-2">
        {hasPermission(Permission.EDIT_APP) && (
          <Link href={`/owner/${app.id}/settings`}>
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(app.id);
            // Could add a toast notification here
          }}
        >
          Copy App ID
        </Button>
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
          userRole={null} // Will use default active/inactive indicator
          roleLabel={getRoleLabel()}
          actions={ownerActions}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">{ownerStats}</div>
            {githubSection && <div className="ml-8">{githubSection}</div>}
          </div>
        </AppProfile>
      </div>

      {/* Activity and Top Models Section */}
      <div className="px-6 mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
          <ActivityChart app={app} />
          <TopModelsCard app={app} />
        </div>
      </div>

      {/* Data Cards Section */}
      <div className="px-6 mt-12 mb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overview Stats Card */}
          <OverviewStats app={app} showAdvanced={true} />

          {/* API Keys Card */}
          <ApiKeysCard
            app={app}
            hasCreatePermission={hasPermission(Permission.CREATE_API_KEYS)}
            hasManagePermission={hasPermission(Permission.MANAGE_ALL_API_KEYS)}
            onCreateApiKey={onCreateApiKey}
            onArchiveApiKey={onArchiveApiKey}
            deletingKeyId={deletingKeyId}
          />

          {/* Recent Activity Card */}
          <RecentActivityCard app={app} />
        </div>
      </div>
    </AppDetailLayout>
  );
}
