'use client';

import {
  Activity,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Key,
  Plus,
  Trash,
  X,
  Zap,
  TrendingUp,
  Shield,
  Users,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import ApiKeyModal from './ApiKeyModal';
import CreateApiKeyModal from './CreateApiKeyModal';
import { GlassButton } from './glass-button';
import { formatCurrency } from '@/lib/balance';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { ProfileAvatar } from './ui/profile-avatar';
import { CommitChart } from './activity-chart/chart';
import { AppRole, Permission } from '@/lib/permissions/types';
import { PermissionService } from '@/lib/permissions/service';
import { githubApi, GitHubRepo, GitHubUser } from '@/lib/github-api';
import { DotPattern } from './ui/dot-background';
import { AuthenticatedEchoApp, PublicEchoApp } from '@/lib/types/apps';

interface EchoAppDetailProps {
  appId: string;
}

// Detailed app info returned by the API with additional fields
interface DetailedEchoApp extends AuthenticatedEchoApp {
  githubId?: string;
  githubType?: 'user' | 'repo';
  user: {
    id: string;
    email: string;
    name?: string;
    profilePictureUrl?: string;
  };
  apiKeys: Array<{
    id: string;
    name?: string;
    isActive: boolean;
    createdAt: string;
    lastUsed?: string;
    totalSpent: number;
    creator: {
      email: string;
      name?: string;
    } | null;
  }>;
  stats: {
    totalTransactions: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    modelUsage: Array<{
      model: string;
      _sum: {
        totalTokens: number | null;
        cost: number | null;
      };
      _count: number;
    }>;
  };
  recentTransactions: Array<{
    id: string;
    model: string;
    totalTokens: number;
    cost: number;
    status: string;
    createdAt: string;
  }>;
}

interface UserPermissions {
  isAuthenticated: boolean;
  userRole: AppRole | null;
  permissions: Permission[];
}

// Helper function to safely format numbers
const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString();
};

// Helper function to safely format cost with more precision
const formatCost = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.0000';
  }
  return `${Number(value).toFixed(4)}`;
};

const transformActivityData = (data: number[] | undefined) => {
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

export default function EchoAppDetail({ appId }: EchoAppDetailProps) {
  const [app, setApp] = useState<DetailedEchoApp | null>(null);
  const [githubData, setGithubData] = useState<GitHubUser | GitHubRepo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<{
    id: string;
    key: string;
    name: string;
  } | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    isAuthenticated: false,
    userRole: null,
    permissions: [],
  });

  // Helper function to determine user permissions based on app data
  const determineUserPermissions = (app: DetailedEchoApp): UserPermissions => {
    const roleString = app.userRole as string;
    const userRole = roleString as AppRole;
    const isAuthenticated = !!roleString && roleString !== AppRole.PUBLIC;

    // Use the centralized permission service instead of duplicating logic
    const permissions = userRole
      ? PermissionService.getPermissionsForRole(userRole)
      : [Permission.READ_APP];

    return {
      isAuthenticated,
      userRole,
      permissions,
    };
  };

  // Helper function to check if user has specific permission
  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.permissions.includes(permission);
  };

  const fetchAppDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/apps/${appId}`);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401/403 as potential public access
        if (response.status === 401 || response.status === 403) {
          // Try to fetch public app info if available
          try {
            const publicResponse = await fetch(`/api/apps/public`);
            const publicData = await publicResponse.json();
            const publicApp = publicData.apps?.find(
              (app: PublicEchoApp) => app.id === appId
            );

            if (publicApp) {
              const appData: DetailedEchoApp = {
                ...publicApp,
                userRole: AppRole.PUBLIC,
                permissions: [Permission.READ_APP],
                description: publicApp.description || '',
                profilePictureUrl: publicApp.profilePictureUrl || '',
                bannerImageUrl: publicApp.bannerImageUrl || '',
                apiKeys: [],
                stats: {
                  totalTransactions: publicApp._count?.llmTransactions || 0,
                  totalTokens: publicApp.totalTokens || 0,
                  totalInputTokens: 0,
                  totalOutputTokens: 0,
                  totalCost: publicApp.totalCost || 0,
                  modelUsage: [],
                },
                recentTransactions: [],
                user: publicApp.owner,
              };
              setApp(appData);
              setUserPermissions(determineUserPermissions(appData));
              return;
            }
          } catch (publicError) {
            console.error('Error fetching public app details:', publicError);
          }
        }
        setError(data.error || 'Failed to load app details');
        return;
      }

      setApp(data);
      setUserPermissions(determineUserPermissions(data));
    } catch (error) {
      console.error('Error fetching app details:', error);
      setError('Failed to load app details');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchAppDetails();

    // Check for payment success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [appId, fetchAppDetails]);

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

  const handleCreateApiKey = async (data: {
    name: string;
    echoAppId: string;
  }) => {
    try {
      const response = await fetch(`/api/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create API key');
      }

      // Store the new API key for display in the modal
      setNewApiKey({
        id: result.apiKey.id,
        key: result.apiKey.key,
        name: result.apiKey.name,
      });

      // Close the create modal and show the key display modal
      setShowCreateApiKeyModal(false);
      setShowApiKeyModal(true);

      // Refresh app details to show the new key in the list
      await fetchAppDetails();
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  };

  const handleRenameApiKey = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename API key');
      }

      await fetchAppDetails(); // Refresh data
    } catch (error) {
      console.error('Error renaming API key:', error);
      throw error;
    }
  };

  const handleArchiveApiKey = async (id: string) => {
    setDeletingKeyId(id);
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive API key');
      }

      await fetchAppDetails(); // Refresh data
    } catch (error) {
      console.error('Error archiving API key:', error);
    } finally {
      setDeletingKeyId(null);
    }
  };

  // PUBLIC VIEW COMPONENT - Limited information for unauthenticated users
  const PublicView = () => {
    if (!app) return null;

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

        {/* Header with back button */}
        <div className="absolute top-8 left-8 z-50">
          <Link href="/">
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

        {/* Banner Section */}
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

        {/* Profile and Info Section */}
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
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background bg-blue-500 shadow-sm flex items-center justify-center">
                  <Eye className="h-3 w-3 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-4xl font-bold text-foreground">
                        {app.name}
                      </h1>
                      <Badge variant="outline" className="text-xs">
                        Public App
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                      {app.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Basic Public Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </p>
                    <Badge variant={app.isActive ? 'default' : 'secondary'}>
                      {app.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Requests Served
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {formatNumber(app.stats?.totalTransactions)}
                    </p>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Call to Action */}
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

                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 inline mr-2" />
                    This is a public application preview. Sign in to access full
                    features, create API keys, and view detailed analytics.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Activity Chart for Public Users */}
        <div className="px-6 mt-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Activity</h2>
          <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
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
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="text-center py-12 fade-in">
        <h2 className="text-xl font-semibold text-foreground">App not found</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    );
  }

  // CUSTOMER VIEW COMPONENT - Limited access for customers
  const CustomerView = () => {
    if (!app) return null;

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
        {showPaymentSuccess && (
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
              onClick={() => setShowPaymentSuccess(false)}
              className="!h-8 !w-8"
              variant="secondary"
            >
              <X className="h-4 w-4" />
            </GlassButton>
          </div>
        )}

        {/* Header with back button */}
        <div className="absolute top-8 left-8 z-50">
          <Link href="/">
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

        {/* Banner Section */}
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

        {/* Profile and Info Section */}
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
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background bg-orange-500 shadow-sm flex items-center justify-center">
                  <Users className="h-3 w-3 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-4xl font-bold text-foreground">
                        {app.name}
                      </h1>
                      <Badge variant="outline" className="text-xs">
                        Customer Access
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                      {app.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Customer Usage Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

                <Separator className="mb-6" />

                {/* Action Row */}
                <div className="flex items-center gap-3">
                  {hasPermission(Permission.MANAGE_OWN_API_KEYS) && (
                    <Button
                      onClick={() => setShowCreateApiKeyModal(true)}
                      size="default"
                      variant="default"
                    >
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
              </div>
            </div>
          </Card>
        </div>

        {/* Customer Data Cards Section */}
        <div className="px-6 mt-8 mb-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Your API Keys Card */}
            <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white">
                    <Key className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">Your API Keys</h3>
                </div>
                {hasPermission(Permission.MANAGE_OWN_API_KEYS) && (
                  <button onClick={() => setShowCreateApiKeyModal(true)}>
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {app.apiKeys && app.apiKeys.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Active Keys</span>
                      <span className="font-bold">{app.apiKeys.length}</span>
                    </div>
                    {app.apiKeys
                      .slice(0, 3)
                      .map((apiKey: DetailedEchoApp['apiKeys'][0]) => (
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
                            {hasPermission(Permission.MANAGE_OWN_API_KEYS) && (
                              <button
                                onClick={() => handleArchiveApiKey(apiKey.id)}
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
                    <p className="text-muted-foreground text-sm">
                      No API keys yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create one to get started
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Your Recent Activity Card */}
            <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Your Recent Activity</h3>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {app.recentTransactions && app.recentTransactions.length > 0 ? (
                  <>
                    {app.recentTransactions
                      .slice(0, 4)
                      .map(
                        (
                          transaction: DetailedEchoApp['recentTransactions'][0]
                        ) => (
                          <div
                            key={transaction.id}
                            className="flex justify-between items-start text-sm"
                          >
                            <div className="flex-1">
                              <p className="font-medium truncate">
                                {transaction.model}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  transaction.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCost(transaction.cost)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatNumber(transaction.totalTokens)} tokens
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    {app.recentTransactions.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        +{app.recentTransactions.length - 4} more transactions
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">
                      No transactions yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Activity will appear here
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Activity Chart for Customer Users */}
        <div className="px-6 mt-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Activity</h2>
          <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
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

        {/* Modals */}
        <div className="relative z-50">
          {showCreateApiKeyModal && app && (
            <CreateApiKeyModal
              echoAppId={app.id}
              onClose={() => setShowCreateApiKeyModal(false)}
              onSubmit={handleCreateApiKey}
            />
          )}

          {showApiKeyModal && newApiKey && (
            <ApiKeyModal
              apiKey={newApiKey}
              onClose={() => {
                setShowApiKeyModal(false);
                setNewApiKey(null);
              }}
              onRename={handleRenameApiKey}
            />
          )}
        </div>
      </div>
    );
  };

  // Render PUBLIC view for unauthenticated users or public role
  if (
    !userPermissions.isAuthenticated ||
    userPermissions.userRole === AppRole.PUBLIC
  ) {
    return <PublicView />;
  }

  // Render CUSTOMER view for customers with limited access
  if (userPermissions.userRole === AppRole.CUSTOMER) {
    return <CustomerView />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Dot Background Pattern */}
      <DotPattern
        className="opacity-30"
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
      />
      {/* Payment Success Notification */}
      {showPaymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Payment Successful!
              </h4>
              <p className="text-sm text-green-700">
                Credits have been added to your {app.name} account.
              </p>
            </div>
          </div>
          <GlassButton
            onClick={() => setShowPaymentSuccess(false)}
            className="!h-8 !w-8"
            variant="secondary"
          >
            <X className="h-4 w-4" />
          </GlassButton>
        </div>
      )}

      {/* Banner Section */}
      <div className="relative z-10">
        {/* Header with back button - positioned absolutely over banner */}
        <div className="absolute top-8 left-8 z-50">
          <Link href="/">
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
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-black/20 z-0"></div>
              <div className="absolute top-0 left-0 w-full h-full z-0">
                <div className="absolute top-16 left-16 w-40 h-40 bg-white/8 rounded-full blur-xl"></div>
                <div className="absolute bottom-12 right-20 w-32 h-32 bg-white/5 rounded-full blur-lg"></div>
                <div className="absolute top-24 right-40 w-20 h-20 bg-white/12 rounded-full blur-md"></div>
              </div>
            </>
          )}
        </div>

        {/* Profile and Info Section */}
        <div className="relative -mt-20 px-8 pb-8">
          <Card className="p-8 bg-card shadow-2xl border border-border">
            <div className="flex items-start gap-8">
              {/* Profile Picture */}
              <div className="relative flex-shrink-0">
                <ProfileAvatar
                  name={app.name}
                  src={app.profilePictureUrl}
                  size="2xl"
                  rounded="2xl"
                  className="shadow-lg"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background ${
                    app.isActive ? 'bg-green-500' : 'bg-gray-400'
                  } shadow-sm`}
                ></div>
              </div>

              {/* Main App Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-4xl font-bold text-foreground">
                        {app.name}
                      </h1>
                      <Badge variant="outline" className="text-xs">
                        {userPermissions.userRole === AppRole.OWNER
                          ? 'Owner'
                          : userPermissions.userRole === AppRole.ADMIN
                            ? 'Administrator'
                            : 'Full Access'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                      {app.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {githubData && (
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
                    )}
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Enhanced Stats Grid */}
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

                  {/* Only show owner details to ADMIN/OWNER */}
                  {hasPermission(Permission.VIEW_ANALYTICS) && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Owner
                      </p>
                      <p className="text-sm text-foreground font-medium truncate">
                        {app.user?.name || app.user?.email || 'Unknown'}
                      </p>
                    </div>
                  )}

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

                <Separator className="mb-6" />

                {/* Action Row */}
                <div className="flex items-center justify-between">
                  {/* Primary Actions */}
                  <div className="flex gap-3">
                    {hasPermission(Permission.CREATE_API_KEYS) && (
                      <Button
                        onClick={() => setShowCreateApiKeyModal(true)}
                        size="default"
                        variant="default"
                      >
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
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Activity and Top Models Section */}
      <div className="px-6 mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
          {/* Activity Chart */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Activity</h2>
            <Card className="flex-1 p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
              <div className="h-full">
                <CommitChart
                  data={{
                    data: transformActivityData(app.activityData),
                    isLoading: false,
                  }}
                  numPoints={app.activityData?.length || 0}
                  timeWindowOption={{ value: '30d' }}
                  startDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                  endDate={new Date()}
                  chartHeight={280}
                  shouldAnimate={true}
                />
              </div>
            </Card>
          </div>

          {/* Top Models */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Top Models</h2>
            <Card className="flex-1 p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-0 h-full">
                {app.stats?.modelUsage && app.stats.modelUsage.length > 0 ? (
                  <div className="space-y-4">
                    {app.stats.modelUsage
                      .slice(0, 5)
                      .map(
                        (
                          usage: DetailedEchoApp['stats']['modelUsage'][0],
                          index: number
                        ) => (
                          <div
                            key={usage.model}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {usage.model}
                                </p>
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
                        )
                      )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No model usage yet
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Data Cards Section */}
      <div className="px-6 mt-12 mb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overview Stats Card */}
          <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">Overview</h3>
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Total Transactions
                </span>
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
            </div>
          </Card>

          {/* API Keys Card */}
          <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white">
                  <Key className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">API Keys</h3>
              </div>
              {hasPermission(Permission.CREATE_API_KEYS) && (
                <button onClick={() => setShowCreateApiKeyModal(true)}>
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              {app.apiKeys && app.apiKeys.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Keys</span>
                    <span className="font-bold">{app.apiKeys.length}</span>
                  </div>
                  {app.apiKeys
                    .slice(0, 3)
                    .map((apiKey: DetailedEchoApp['apiKeys'][0]) => (
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
                          {hasPermission(Permission.MANAGE_ALL_API_KEYS) && (
                            <button
                              onClick={() => handleArchiveApiKey(apiKey.id)}
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
                  <p className="text-muted-foreground text-sm">
                    No API keys yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create one to get started
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity Card */}
          <Card className="p-6 hover:border-secondary relative shadow-secondary shadow-[0_0_8px] transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">Recent Activity</h3>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              {app.recentTransactions && app.recentTransactions.length > 0 ? (
                <>
                  {app.recentTransactions
                    .slice(0, 4)
                    .map(
                      (
                        transaction: DetailedEchoApp['recentTransactions'][0]
                      ) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-start text-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium truncate">
                              {transaction.model}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCost(transaction.cost)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(transaction.totalTokens)} tokens
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  {app.recentTransactions.length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      +{app.recentTransactions.length - 4} more transactions
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    No transactions yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activity will appear here
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <div className="relative z-50">
        {showCreateApiKeyModal &&
          app &&
          hasPermission(Permission.CREATE_API_KEYS) && (
            <CreateApiKeyModal
              echoAppId={app.id}
              onClose={() => setShowCreateApiKeyModal(false)}
              onSubmit={handleCreateApiKey}
            />
          )}

        {showApiKeyModal &&
          newApiKey &&
          hasPermission(Permission.MANAGE_ALL_API_KEYS) && (
            <ApiKeyModal
              apiKey={newApiKey}
              onClose={() => {
                setShowApiKeyModal(false);
                setNewApiKey(null);
              }}
              onRename={handleRenameApiKey}
            />
          )}
      </div>
    </div>
  );
}
