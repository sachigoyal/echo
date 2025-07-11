import {
  Activity,
  ArrowLeft,
  CheckCircle,
  Key,
  Plus,
  Trash,
  X,
  Users,
  Eye,
  ExternalLink,
  User as UserIcon,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { formatCurrency } from '@/lib/balance';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { CommitChart } from '@/components/activity-chart/chart';
import { DotPattern } from '@/components/ui/dot-background';
import { GlassButton } from '@/components/glass-button';
import { DetailedEchoApp } from '@/hooks/useEchoAppDetail';
import { AppRole } from '@/lib/permissions/types';

// Add GitHub API imports
import { githubApi, GitHubUser, GitHubRepo } from '@/lib/github-api';
import { useState, useEffect } from 'react';

// Helper functions
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString();
};

export const formatCost = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.0000';
  }
  return `${Number(value).toFixed(4)}`;
};

export const transformActivityData = (data: number[] | undefined) => {
  if (!data || data.length === 0) {
    return [];
  }
  return data.map((count, index) => ({
    index,
    count,
    date: new Date(
      Date.now() - (data.length - 1 - index) * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));
};

// Shared Layout Component
interface AppDetailLayoutProps {
  children: ReactNode;
  showPaymentSuccess?: boolean;
  onDismissPaymentSuccess?: () => void;
}

export function AppDetailLayout({
  children,
  showPaymentSuccess,
  onDismissPaymentSuccess,
}: AppDetailLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      <DotPattern
        className="opacity-30"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />

      {/* Payment Success Notification */}
      {showPaymentSuccess && onDismissPaymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Payment Successful!
              </h4>
              <p className="text-sm text-green-700">
                Credits have been added to your account.
              </p>
            </div>
          </div>
          <GlassButton
            onClick={onDismissPaymentSuccess}
            className="!h-8 !w-8"
            variant="secondary"
          >
            <X className="h-4 w-4" />
          </GlassButton>
        </div>
      )}

      {children}
    </div>
  );
}

// Shared Banner Component
interface AppBannerProps {
  app: DetailedEchoApp;
  backUrl?: string;
}

export function AppBanner({ app, backUrl = '/' }: AppBannerProps) {
  return (
    <>
      {/* Header with back button */}
      <div className="absolute top-8 left-8 z-50">
        <Link href={backUrl}>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Banner Background */}
      <div className="h-64 relative overflow-hidden shadow-lg shadow-blue-500/25">
        {app.bannerImageUrl ? (
          <>
            <Image
              src={app.bannerImageUrl}
              alt={`${app.name} banner`}
              fill
              className="object-cover z-0"
            />
            <div className="absolute inset-0 bg-black/40 z-0"></div>
          </>
        ) : (
          <>
            <div className="h-full bg-gradient-to-r from-secondary via-muted to-secondary/80 z-0"></div>
            <div className="absolute inset-0 bg-black/20 z-0"></div>
          </>
        )}
      </div>
    </>
  );
}

// App Profile Section
interface AppProfileProps {
  app: DetailedEchoApp;
  userRole: AppRole | null;
  roleLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

// Add GitHubUserInfo component
interface GitHubUserInfoProps {
  githubId: string;
  githubType: 'user' | 'repo';
}

function GitHubUserInfo({ githubId, githubType }: GitHubUserInfoProps) {
  const [githubData, setGithubData] = useState<GitHubUser | GitHubRepo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        setLoading(true);
        setError(false);

        let data: GitHubUser | GitHubRepo | null = null;

        if (githubType === 'user') {
          data = await githubApi.verifyUserById(githubId);
        } else if (githubType === 'repo') {
          data = await githubApi.verifyRepoById(githubId);
        }

        setGithubData(data);
        setError(data === null);
      } catch (err) {
        console.error('Error fetching GitHub data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [githubId, githubType]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
        <span className="text-sm">Loading GitHub info...</span>
      </div>
    );
  }

  if (error || !githubData) {
    return null; // Don't show anything if GitHub data couldn't be fetched
  }

  const isUser = 'login' in githubData;
  const displayName = isUser
    ? githubData.name || githubData.login
    : githubData.full_name;
  const username = isUser ? `@${githubData.login}` : githubData.full_name;
  const avatarUrl = isUser
    ? githubData.avatar_url
    : githubData.owner.avatar_url;

  return (
    <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
      <Image
        src={avatarUrl}
        alt={displayName}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {isUser ? (
            <UserIcon className="h-3 w-3 text-secondary flex-shrink-0" />
          ) : (
            <GitBranch className="h-3 w-3 text-secondary flex-shrink-0" />
          )}
          <span className="text-foreground text-sm font-medium truncate">
            {displayName}
          </span>
        </div>
        <p className="text-muted-foreground text-xs truncate">
          {isUser ? username : githubData.description || 'No description'}
        </p>
      </div>
      <a
        href={githubData.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-secondary hover:text-secondary/80 transition-colors"
        title={`View on GitHub`}
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

export function AppProfile({
  app,
  userRole,
  roleLabel,
  actions,
  children,
}: AppProfileProps) {
  const getRoleIcon = () => {
    switch (userRole) {
      case AppRole.PUBLIC:
        return <Eye className="h-3 w-3 text-white" />;
      case AppRole.CUSTOMER:
        return <Users className="h-3 w-3 text-white" />;
      default:
        return null;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case AppRole.PUBLIC:
        return 'bg-blue-500';
      case AppRole.CUSTOMER:
        return 'bg-orange-500';
      default:
        return app.isActive ? 'bg-green-500' : 'bg-gray-400';
    }
  };

  return (
    <div className="relative -mt-20 px-8 pb-8 z-10">
      <Card className="p-8 bg-card shadow-2xl border border-border">
        <div className="flex items-start gap-8">
          <div className="relative flex-shrink-0">
            <ProfileAvatar
              name={app.name}
              src={app.profilePictureUrl}
              size="2xl"
              rounded="2xl"
              className="shadow-lg"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background ${getRoleColor()} shadow-sm flex items-center justify-center`}
            >
              {getRoleIcon()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold text-foreground">
                    {app.name}
                  </h1>
                  {roleLabel && (
                    <Badge variant="outline" className="text-xs">
                      {roleLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                  {app.description || 'No description provided'}
                </p>
              </div>

              {/* GitHub Card Section - Right Aligned with title */}
              {app.githubId && app.githubType && (
                <div className="w-80 flex-shrink-0">
                  <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white">
                        {app.githubType === 'user' ? (
                          <UserIcon className="h-4 w-4" />
                        ) : (
                          <GitBranch className="h-4 w-4" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold">
                        GitHub{' '}
                        {app.githubType === 'user' ? 'User' : 'Repository'}
                      </h3>
                    </div>
                    <GitHubUserInfo
                      githubId={app.githubId}
                      githubType={app.githubType}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator className="mb-6" />

            {children}

            {actions && (
              <>
                <Separator className="mb-6" />
                {actions}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Activity Chart Card
interface ActivityChartProps {
  app: DetailedEchoApp;
  title?: string;
}

export function ActivityChart({ app, title = 'Activity' }: ActivityChartProps) {
  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Card className="flex-1 p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
        <div className="h-64">
          <CommitChart
            data={{
              data: transformActivityData(app.activityData),
              isLoading: false,
            }}
            numPoints={app.activityData?.length || 0}
            timeWindowOption={{ value: '30d' }}
            startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
            endDate={new Date()}
            chartHeight={240}
            shouldAnimate={true}
          />
        </div>
      </Card>
    </div>
  );
}

// Overview Stats Card
interface OverviewStatsProps {
  app: DetailedEchoApp;
  showAdvanced?: boolean;
}

export function OverviewStats({
  app,
  showAdvanced = true,
}: OverviewStatsProps) {
  return (
    <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50 h-80 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
          <Activity className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-bold">Overview</h3>
      </div>

      <Separator className="my-4" />

      <div className="space-y-4 flex-1">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Transactions</span>
          <span className="font-bold">
            {formatNumber(app.stats?.totalTransactions)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Tokens</span>
          <span className="font-bold">
            {formatNumber(app.stats?.totalTokens)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Spent</span>
          <Badge className="text-black dark:text-white border-[1px] bg-transparent shadow-none">
            {formatCurrency(app.stats?.totalCost)}
          </Badge>
        </div>
        {showAdvanced && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium text-sm">
              {new Date(app.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

// API Keys Card
interface ApiKeysCardProps {
  app: DetailedEchoApp;
  hasCreatePermission: boolean;
  hasManagePermission: boolean;
  onCreateApiKey?: () => void;
  onArchiveApiKey?: (id: string) => void;
  deletingKeyId?: string | null;
}

export function ApiKeysCard({
  app,
  hasCreatePermission,
  hasManagePermission,
  onCreateApiKey,
  onArchiveApiKey,
  deletingKeyId,
}: ApiKeysCardProps) {
  return (
    <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50 h-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white">
            <Key className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold">API Keys</h3>
        </div>
        {hasCreatePermission && onCreateApiKey && (
          <Button onClick={onCreateApiKey} className="!h-8 !w-8 !p-0">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      <div className="space-y-3 flex-1 overflow-auto">
        {app.apiKeys && app.apiKeys.length > 0 ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Keys</span>
              <span className="font-bold">{app.apiKeys.length}</span>
            </div>
            {app.apiKeys.slice(0, 3).map(apiKey => (
              <div
                key={apiKey.id}
                className="flex justify-between items-center text-sm"
              >
                <span className="truncate flex-1">
                  {apiKey.name || 'Unnamed Key'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatCurrency(apiKey.totalSpent)}
                  </span>
                  {hasManagePermission && onArchiveApiKey && (
                    <button
                      onClick={() => onArchiveApiKey(apiKey.id)}
                      disabled={deletingKeyId === apiKey.id}
                      className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {app.apiKeys.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{app.apiKeys.length - 3} more keys
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">No API keys yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create one to get started
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Recent Activity Card
interface RecentActivityCardProps {
  app: DetailedEchoApp;
  title?: string;
}

export function RecentActivityCard({
  app,
  title = 'Recent Activity',
}: RecentActivityCardProps) {
  return (
    <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50 h-80 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3 flex-1 overflow-auto">
        {app.recentTransactions && app.recentTransactions.length > 0 ? (
          <>
            {app.recentTransactions.slice(0, 4).map(transaction => (
              <div
                key={transaction.id}
                className="flex justify-between items-start text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium truncate">{transaction.model}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCost(transaction.cost)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(transaction.totalTokens)} tokens
                  </p>
                </div>
              </div>
            ))}
            {app.recentTransactions.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{app.recentTransactions.length - 4} more transactions
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8 flex-1 flex items-center justify-center">
            <div>
              <p className="text-muted-foreground text-sm">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start using your API keys to see activity
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Top Models Card
interface TopModelsCardProps {
  app: DetailedEchoApp;
  title?: string;
}

export function TopModelsCard({
  app,
  title = 'Top Models',
}: TopModelsCardProps) {
  return (
    <div className="flex flex-col">
      <Card className="flex-1 p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50 h-80 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <Separator className="my-4" />
        <CardContent className="p-0 h-full flex-1 overflow-auto">
          {app.stats?.modelUsage && app.stats.modelUsage.length > 0 ? (
            <div className="space-y-4">
              {app.stats.modelUsage.slice(0, 5).map((usage, index) => (
                <div
                  key={usage.model}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{usage.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(usage._count)} requests
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCost(usage._sum?.cost)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(usage._sum?.totalTokens)} tokens
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <div>
                <p className="text-muted-foreground text-sm">
                  No model usage yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Usage statistics will appear here
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
