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

import { GlassButton } from './glass-button';
import { useRouter } from 'next/navigation';
import DeleteAppModal from './DeleteAppModal';

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
  const [error, setError] = useState<string | null>(null);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appToDelete, setAppToDelete] = useState<EchoAppWithRole | null>(null);
  const router = useRouter();

  const openDeleteModal = (app: EchoAppWithRole, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setAppToDelete(app);
    setShowDeleteModal(true);
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAppToDelete(null);
    setError(null);
  };

  const handleDeleteApp = async (appId: string) => {
    setDeletingAppId(appId);
    setError(null);

    try {
      const response = await fetch(`/api/apps/${appId}`, {
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
      throw error; // Re-throw so the modal can handle it
    } finally {
      setDeletingAppId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {apps.length} {apps.length === 1 ? 'app' : 'apps'}
            </span>
          </div>
          <GlassButton
            onClick={() => router.push('/owner/apps/create')}
            variant="secondary"
            className="bg-secondary/10 border-secondary/20 hover:bg-secondary/15 hover:border-secondary/30"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Application
          </GlassButton>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/5 rounded-full blur-xl"></div>
            <ActivityIcon className="relative mx-auto h-16 w-16 text-zinc-400" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            No applications
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Create your first AI application with Echo
          </p>
          <div className="mt-6">
            <GlassButton
              onClick={() => router.push('/owner/apps/create')}
              variant="secondary"
              className="bg-secondary/10 border-secondary/20 hover:bg-secondary/15 hover:border-secondary/30"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Application
            </GlassButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <div
              key={app.id}
              className="group relative bg-card border border-border rounded-xl shadow-lg shadow-zinc-100/50 dark:shadow-zinc-900/30 overflow-hidden transition-all duration-300 hover:border-secondary/50 hover:shadow-xl hover:shadow-secondary/10 hover:-translate-y-1 h-64 flex flex-col"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Archive Button */}
              <button
                onClick={e => openDeleteModal(app, e)}
                disabled={deletingAppId === app.id}
                className="absolute top-4 right-4 z-10 p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 disabled:opacity-50"
                title="Archive app"
              >
                {deletingAppId === app.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>

              {/* Content */}
              <div className="relative p-6 flex-1 flex flex-col">
                <div className="pr-8 mb-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-secondary transition-colors duration-300 mb-2 truncate">
                    {app.name}
                  </h3>
                  {app.description && (
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-2">
                      {app.description}
                    </p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="flex-1 flex flex-col justify-center mb-4">
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {app._count.apiKeys}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        API Keys
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {app._count.llmTransactions}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        Transactions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${app.totalCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
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
                    className="flex items-center justify-center px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-border rounded-lg text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 transition-all duration-300 text-sm font-medium group/btn"
                  >
                    <KeyIcon className="h-4 w-4 mr-2 group-hover/btn:text-secondary transition-colors duration-300" />
                    Manage
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/apps/${app.id}`);
                    }}
                    className="flex items-center justify-center px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary hover:text-white hover:bg-secondary hover:border-secondary transition-all duration-300 text-sm font-medium group/btn"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2 group-hover/btn:text-white transition-colors duration-300" />
                    Dashboard
                  </button>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-secondary opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      )}

      <DeleteAppModal
        isOpen={showDeleteModal}
        app={appToDelete}
        isDeleting={deletingAppId === appToDelete?.id}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteApp}
      />
    </div>
  );
}
