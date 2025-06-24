'use client';

import { useState } from 'react';
import {
  PlusIcon,
  KeyIcon,
  ChartBarIcon,
  TrashIcon,
  ActivityIcon,
} from 'lucide-react';
import { AppRole } from '@/lib/permissions/types';
import CreateEchoAppModal from './CreateEchoAppModal';
import { GlassButton } from './glass-button';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const handleCreateApp = async (appData: {
    name: string;
    description?: string;
    githubType?: 'user' | 'repo';
    githubId?: string;
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Apps You Own
          </h2>
          <p className="text-gray-400 mt-1">
            Manage your applications and view customer analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-300">
              {apps.length} {apps.length === 1 ? 'app' : 'apps'}
            </span>
          </div>
          <GlassButton
            onClick={() => setShowCreateModal(true)}
            variant="secondary"
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400/50"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Echo App
          </GlassButton>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-900/50 to-red-800/30 border border-red-500/50 rounded-2xl p-4 backdrop-blur-sm">
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-xl"></div>
            <ActivityIcon className="relative mx-auto h-16 w-16 text-gray-400" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-white">No apps yet</h3>
          <p className="mt-2 text-gray-400 max-w-sm mx-auto">
            Get started by creating your first Echo application.
          </p>
          <div className="mt-6">
            <GlassButton
              onClick={() => setShowCreateModal(true)}
              variant="secondary"
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400/50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Echo App
            </GlassButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <div
              key={app.id}
              className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 h-64 flex flex-col"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Archive Button */}
              <button
                onClick={e => handleArchiveApp(app.id, e)}
                disabled={deletingAppId === app.id}
                className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all duration-300 disabled:opacity-50"
                title="Archive app"
              >
                {deletingAppId === app.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>

              {/* Content */}
              <div className="relative p-5 flex-1 flex flex-col">
                <div className="pr-8 mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-300 mb-2 truncate">
                    {app.name}
                  </h3>
                  {app.description && (
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                      {app.description}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="flex-1 flex flex-col justify-center mb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {app._count.apiKeys}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        API Keys
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {app._count.llmTransactions}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Transactions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-400">
                        ${app.totalCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Total Cost
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button
                    onClick={() => {
                      router.push(`/owner/apps/${app.id}/dashboard`);
                    }}
                    className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-gray-700/50 to-gray-600/30 border border-gray-600/50 rounded-xl text-gray-300 hover:text-white hover:border-gray-500/70 transition-all duration-300 text-sm font-medium backdrop-blur-sm group/btn"
                  >
                    <KeyIcon className="h-4 w-4 mr-2 group-hover/btn:text-blue-400 transition-colors duration-300" />
                    Manage
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/apps/${app.id}`);
                    }}
                    className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/20 border border-blue-500/50 rounded-xl text-blue-300 hover:text-white hover:from-blue-600/40 hover:to-purple-600/30 hover:border-blue-400/70 transition-all duration-300 text-sm font-medium backdrop-blur-sm group/btn"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2 group-hover/btn:text-white transition-colors duration-300" />
                    Dashboard
                  </button>
                </div>
              </div>

              {/* Bottom gradient border */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
