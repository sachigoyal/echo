'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  PlusIcon,
  KeyIcon,
  ChartBarIcon,
  UserIcon,
  LogOutIcon,
  TrashIcon,
} from 'lucide-react';
import CreateEchoAppModal from '@/components/CreateEchoAppModal';

interface EchoApp {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  totalTokens: number;
  totalCost: number;
  _count: {
    apiKeys: number;
    llmTransactions: number;
  };
}

export default function EchoAppsDashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [echoApps, setEchoApps] = useState<EchoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchEchoApps();
    }
  }, [isLoaded, user]);

  const fetchEchoApps = async () => {
    try {
      setError(null);
      const response = await fetch('/api/apps');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch echo apps');
      }

      setEchoApps(data.echoApps || []);
    } catch (error) {
      console.error('Error fetching echo apps:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch echo apps'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (appData: {
    name: string;
    description?: string;
  }) => {
    setError(null);
    const response = await fetch('/api/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create echo app');
    }

    await fetchEchoApps(); // Refresh the list
    setShowCreateModal(false);
  };

  const handleDeleteApp = async (id: string, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent navigation to app detail page
    event.stopPropagation(); // Stop event propagation

    setDeletingAppId(id);
    setError(null);

    try {
      const response = await fetch(`/api/echo-apps/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete echo app');
      }

      await fetchEchoApps(); // Refresh the list
    } catch (error) {
      console.error('Error deleting echo app:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to delete echo app'
      );
    } finally {
      setDeletingAppId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with User Menu and Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Manage your Echo applications and monitor usage.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Echo App
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent"
            >
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-10">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent rounded-md"
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/20 border border-destructive rounded-md p-4">
          <div className="text-sm text-destructive-foreground">{error}</div>
        </div>
      )}
      {/* Echo Apps Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Your Echo Apps
          </h2>
          <span className="text-sm text-muted-foreground">
            {echoApps.length} apps
          </span>
        </div>

        {echoApps.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <ChartBarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">
              No Echo apps
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
            {echoApps.map(app => (
              <Link
                key={app.id}
                href={`/apps/${app.id}`}
                className="block bg-card rounded-lg border border-border hover:border-secondary group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-card-foreground truncate group-hover:text-secondary">
                      {app.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.isActive
                            ? 'bg-secondary/20 text-secondary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {app.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={e => handleDeleteApp(app.id, e)}
                        className={`p-1 rounded-full hover:bg-destructive/10 group-hover:opacity-100 ${
                          deletingAppId === app.id ? 'opacity-50' : 'opacity-0'
                        }`}
                        disabled={deletingAppId === app.id}
                        aria-label="Delete app"
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {app.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {app.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-muted-foreground">
                        <KeyIcon className="h-4 w-4 mr-1" />
                        API Keys
                      </div>
                      <div className="font-semibold text-card-foreground">
                        {app._count.apiKeys}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-muted-foreground">
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        Transactions
                      </div>
                      <div className="font-semibold text-card-foreground">
                        {app._count.llmTransactions.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-semibold text-card-foreground">
                        ${Number(app.totalCost).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-muted-foreground">
                        Total Tokens:
                      </span>
                      <span className="font-semibold text-card-foreground">
                        {app.totalTokens.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Created {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateEchoAppModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateApp}
        />
      )}
    </div>
  );
}
