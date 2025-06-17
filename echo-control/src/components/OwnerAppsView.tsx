'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, KeyIcon, ChartBarIcon, TrashIcon } from 'lucide-react';
import { AppRole } from '@/lib/permissions/types';
import CreateEchoAppModal from './CreateEchoAppModal';

interface EchoAppWithRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  totalTokens: number;
  totalCost: number;
  userRole: AppRole;
  permissions?: unknown;
  _count: {
    apiKeys: number;
    llmTransactions: number;
  };
}

interface OwnerAppsViewProps {
  apps: EchoAppWithRole[];
  onRefresh: () => void;
}

export default function OwnerAppsView({ apps, onRefresh }: OwnerAppsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  const handleCreateApp = async (appData: {
    name: string;
    description?: string;
  }) => {
    setError(null);
    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create echo app');
      }

      await onRefresh();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating app:', error);
      setError(error instanceof Error ? error.message : 'Failed to create app');
    }
  };

  const handleArchiveApp = async (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setDeletingAppId(id);
    setError(null);

    try {
      const response = await fetch(`/api/apps/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to archive echo app');
      }

      await onRefresh();
    } catch (error) {
      console.error('Error archiving echo app:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to archive echo app'
      );
    } finally {
      setDeletingAppId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Apps You Own
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your applications and view customer analytics
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Echo App
        </button>
      </div>

      {error && (
        <div className="bg-destructive/20 border border-destructive rounded-md p-4">
          <div className="text-sm text-destructive-foreground">{error}</div>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <ChartBarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-card-foreground">
            No apps yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating your first Echo application.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Echo App
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <div
              key={app.id}
              className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {/* Archive Button */}
              <button
                onClick={e => handleArchiveApp(app.id, e)}
                disabled={deletingAppId === app.id}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                title="Archive app"
              >
                {deletingAppId === app.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>

              <div className="pr-8">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {app.name}
                </h3>
                {app.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {app.description}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">API Keys:</span>
                  <span className="text-foreground">{app._count.apiKeys}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transactions:</span>
                  <span className="text-foreground">
                    {app._count.llmTransactions}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="text-foreground">
                    ${app.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/owner/apps/${app.id}/dashboard`}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent"
                  >
                    <KeyIcon className="h-4 w-4 mr-2" />
                    Manage
                  </Link>
                  <Link
                    href={`/apps/${app.id}`}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateEchoAppModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateApp}
        />
      )}
    </div>
  );
}
