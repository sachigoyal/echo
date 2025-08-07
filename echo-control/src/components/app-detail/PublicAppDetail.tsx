import { AppRole } from '@/lib/permissions/types';
import { PublicEchoApp } from '@/lib/apps/types';
import { formatCurrency } from '@/lib/balance';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserPlus } from 'lucide-react';
import {
  AppDetailLayout,
  AppBanner,
  AppProfile,
  GlobalActivityChart,
  formatNumber,
} from './AppDetailShared';
import { GlobalTopModelsCard } from './GlobalTopModelsCard';
import { UserCountCard } from './UserCountCard';
import { GlobalModelsCard } from './GlobalModelsCard';
import { AppHomepageCard } from './AppHomepageCard';
import { PublicRecentActivityCard } from './RecentActivityDetail';
import JoinAppModal from '../JoinAppModal';

interface PublicAppDetailProps {
  app: PublicEchoApp;
}

export function PublicAppDetail({ app }: PublicAppDetailProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const { user, isLoaded } = useUser();

  // Function to handle joining the app as a customer
  const handleJoinApp = async () => {
    setJoining(true);
    try {
      const response = await fetch(`/api/owner/apps/${app.id}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body for self-enrollment
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join app');
      }

      // Success - redirect to refresh the page and show customer view
      window.location.reload();
    } catch (error) {
      console.error('Error joining app:', error);
      throw error;
    } finally {
      setJoining(false);
    }
  };

  // Show join button only for authenticated users who are not already customers
  const joinActions =
    isLoaded && user ? (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowJoinModal(true)}
          disabled={joining}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {joining ? 'Joining...' : 'Join'}
        </button>
      </div>
    ) : (
      <></>
    );

  const enhancedStats = (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      {/* Owner Information */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">Owner</p>
        <p className="text-sm text-foreground font-medium truncate">
          {app.owner?.name || app.owner?.email || 'Unknown'}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Total Requests
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatNumber(app.stats?.globalTotalTransactions || 0)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Total Tokens
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatNumber(app.stats?.globalTotalTokens || 0)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Total Spending
        </p>
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(app.stats?.globalTotalRevenue || 0)}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">
          Join App
        </p>
        <div className="text-sm text-foreground font-bold mt-2">
          {joinActions}
        </div>
      </div>
    </div>
  );

  return (
    <AppDetailLayout>
      <div className="relative z-10">
        <AppBanner app={app} />

        <AppProfile app={app} userRole={AppRole.PUBLIC} roleLabel="Public App">
          {enhancedStats}
        </AppProfile>
      </div>

      {/* Global Activity Chart - Full Width */}
      <div className="px-6 mb-32 relative z-10">
        <div className="h-64">
          <GlobalActivityChart app={app} title="Global Tokens Over Time" />
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="px-6 mt-8 mb-8 relative z-10">
        {/* First Row - Homepage and User Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <AppHomepageCard app={app} />
          <UserCountCard app={app} />
          <GlobalModelsCard app={app} />
        </div>

        {/* Second Row - Activity and Model Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Activity Card */}
          <PublicRecentActivityCard app={app} title="Global Recent Activity" />

          {/* Models Usage Card */}
          <GlobalTopModelsCard app={app} title="Global Model Usage" />
        </div>
      </div>

      {/* Join App Modal */}
      {showJoinModal && (
        <JoinAppModal
          app={app}
          onClose={() => setShowJoinModal(false)}
          onSubmit={handleJoinApp}
        />
      )}
    </AppDetailLayout>
  );
}
