'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { UserIcon, LogOutIcon, Users } from 'lucide-react';
import { AppRole } from '@/lib/permissions/types';
import OwnerAppsView from './OwnerAppsView';

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

export default function OwnerAppsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [ownedApps, setOwnedApps] = useState<EchoAppWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchApps();

      // Check for payment success in URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        setShowPaymentSuccess(true);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [isLoaded, user]);

  const fetchApps = async () => {
    try {
      setError(null);
      const response = await fetch('/api/apps');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch echo apps');
      }

      const allApps = data.apps || [];

      const owned = allApps.filter(
        (app: EchoAppWithRole) => app.userRole === AppRole.OWNER
      );

      setOwnedApps(owned);
    } catch (error) {
      console.error('Error fetching echo apps:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch echo apps'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with User Menu */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-gray-300">
            Build and monetize your AI applications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Link to Customer Apps */}
          <Link
            href="/"
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-800/50 border border-gray-700/50 rounded-md hover:bg-gray-800/80 backdrop-blur-sm transition-all duration-200"
          >
            <Users className="h-4 w-4" />
            <span>Customer Apps</span>
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/80 backdrop-blur-sm transition-all duration-200"
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
                <UserIcon className="h-8 w-8 text-gray-300" />
              )}
              <span className="text-sm font-medium text-white">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800/90 border border-gray-700/50 rounded-md shadow-lg backdrop-blur-sm z-10">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-gray-700/50 rounded-md transition-all duration-200"
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Success Message */}
      {showPaymentSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="text-sm text-emerald-300">
              ✅ Payment successful! Your credits have been added to your
              account.
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="ml-auto text-emerald-400 hover:text-emerald-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}

      {/* Owner Apps View */}
      <OwnerAppsView apps={ownedApps} onRefresh={fetchApps} />
    </div>
  );
}
