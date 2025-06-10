'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import Image from 'next/image';
import { UserIcon, LogOutIcon } from 'lucide-react';
import { AppRole } from '@/lib/permissions/types';
import OwnerAppsView from './OwnerAppsView';
import CustomerAppsView from './CustomerAppsView';
import UserPaymentCard from './UserPaymentCard';

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

export default function EnhancedEchoAppsDashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [ownedApps, setOwnedApps] = useState<EchoAppWithRole[]>([]);
  const [customerApps, setCustomerApps] = useState<EchoAppWithRole[]>([]);
  const [activeTab, setActiveTab] = useState<'owned' | 'customer'>('owned');
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
      const response = await fetch('/api/echo-apps');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch echo apps');
      }

      const allApps = data.echoApps || [];

      const owned = allApps.filter(
        (app: EchoAppWithRole) => app.userRole === AppRole.OWNER
      );
      const customer = allApps.filter(
        (app: EchoAppWithRole) =>
          app.userRole === AppRole.CUSTOMER || app.userRole === AppRole.ADMIN
      );

      setOwnedApps(owned);
      setCustomerApps(customer);

      // Set default tab based on what the user has
      if (owned.length === 0 && customer.length > 0) {
        setActiveTab('customer');
      }
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with User Menu */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Manage your Echo applications and monitor usage.
          </p>
        </div>
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

      {/* Payment Success Message */}
      {showPaymentSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="text-sm text-emerald-700">
              ✅ Payment successful! Your credits have been added to your
              account.
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="ml-auto text-emerald-500 hover:text-emerald-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/20 border border-destructive rounded-md p-4">
          <div className="text-sm text-destructive-foreground">{error}</div>
        </div>
      )}

      {/* User Payment Card */}
      <UserPaymentCard />

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('owned')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'owned'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            My Apps ({ownedApps.length})
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customer'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Customer Apps ({customerApps.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'owned' && (
        <OwnerAppsView apps={ownedApps} onRefresh={fetchApps} />
      )}

      {activeTab === 'customer' && (
        <CustomerAppsView apps={customerApps} onRefresh={fetchApps} />
      )}
    </div>
  );
}
