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
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ApiKeyModal from './ApiKeyModal';
import CreateApiKeyModal from './CreateApiKeyModal';
import { GlassButton } from './glass-button';

interface EchoAppDetailProps {
  appId: string;
}

interface EchoApp {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  userRole: string;
  user: {
    id: string;
    email: string;
    name?: string;
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

// Helper function to safely format numbers
const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString();
};

// Helper function to safely format currency
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  const numValue = Number(value);

  // Show <$0.01 for values greater than 0 but less than 0.01
  if (numValue > 0 && numValue < 0.01) {
    return '<$0.01';
  }

  return `$${numValue.toFixed(2)}`;
};

// Helper function to safely format cost with more precision
const formatCost = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.0000';
  }
  return `$${Number(value).toFixed(4)}`;
};

export default function EchoAppDetail({ appId }: EchoAppDetailProps) {
  const [app, setApp] = useState<EchoApp | null>(null);
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

  const fetchAppDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/apps/${appId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load app details');
        return;
      }

      setApp(data);
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
        <Link
          href="/"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Payment Success Notification */}
      {showPaymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{app.name}</h1>
            {app.description && (
              <p className="text-muted-foreground">{app.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              app.isActive
                ? 'bg-secondary/20 text-secondary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {app.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Balance and Payment Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-secondary/20 p-2">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-xl font-bold text-card-foreground">
                  {formatNumber(app.stats?.totalTransactions)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-secondary/20 p-2">
                <Key className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="text-xl font-bold text-card-foreground">
                  {app.apiKeys?.length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-secondary/20 p-2">
                <CreditCard className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold text-card-foreground">
                  {formatCurrency(app.stats?.totalCost)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-secondary/20 p-2">
                <Activity className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-xl font-bold text-card-foreground">
                  {formatNumber(app.stats?.totalTokens)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            API Keys
          </h2>
          <GlassButton
            onClick={() => setShowCreateApiKeyModal(true)}
            variant="secondary"
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create API Key
          </GlassButton>
        </div>

        {!app?.apiKeys || app.apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">
              No API keys yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an API key to start using this Echo App.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {app.apiKeys.map(apiKey => (
                  <tr
                    key={apiKey.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {apiKey.name || 'Unnamed Key'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {apiKey.creator?.email ||
                        apiKey.creator?.name ||
                        'Unknown'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {formatCurrency(apiKey.totalSpent)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {apiKey.lastUsed
                        ? new Date(apiKey.lastUsed).toLocaleDateString()
                        : 'Never used'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleArchiveApiKey(apiKey.id)}
                        disabled={deletingKeyId === apiKey.id}
                        className="text-destructive hover:text-destructive/80 ml-2 disabled:opacity-50"
                        title="Archive API Key"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-6">
          Recent Transactions
        </h2>

        {!app.recentTransactions || app.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">
              No transactions yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Transactions will appear here once you start using your API.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {app.recentTransactions.map(transaction => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-card-foreground">
                      {transaction.model}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {formatNumber(transaction.totalTokens)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {formatCost(transaction.cost)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Usage */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-card-foreground mb-6">
          Model Usage
        </h2>

        {!app.stats?.modelUsage || app.stats.modelUsage.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">
              No model usage yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Model usage statistics will appear here once you start using your
              API.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {app.stats.modelUsage.map(usage => (
                  <tr
                    key={usage.model}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-card-foreground">
                      {usage.model}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {formatNumber(usage._count)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {formatNumber(usage._sum?.totalTokens)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-card-foreground">
                      {formatCost(usage._sum?.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
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
  );
}
