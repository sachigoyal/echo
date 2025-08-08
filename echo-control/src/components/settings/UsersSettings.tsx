'use client';

import React from 'react';
import {
  Users,
  Crown,
  Shield,
  User as UserIcon,
  Calendar,
  Key,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/balance';
import Image from 'next/image';
import { useUserSettings } from '@/hooks/useUserSettings';

interface UsersSettingsProps {
  appId: string;
}

export default function UsersSettings({ appId }: UsersSettingsProps) {
  const { users, loading, error, pagination, fetchUsers } =
    useUserSettings(appId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'customer':
        return <UserIcon className="h-4 w-4 text-green-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'admin':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'customer':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">App Users</h3>
        <p className="text-sm text-muted-foreground">
          All active users of your app with their usage details and permissions
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="text-sm text-destructive-foreground">{error}</div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Users ({pagination?.totalCount || 0})
            </h4>
          </div>
          {pagination && pagination.totalCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No users found for this app.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  {/* User Avatar */}
                  <div className="shrink-0">
                    {user.profilePictureUrl ? (
                      <Image
                        src={user.profilePictureUrl}
                        alt={user.name || user.email}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user.name || user.email}
                      </p>
                      <div
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </div>
                    {user.name && (
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {user.email}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {formatDate(user.joinedAt)}
                      </span>
                      <span className="flex items-center">
                        <Key className="h-3 w-3 mr-1" />
                        {user.apiKeyCount} keys
                      </span>
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="text-right ml-4 shrink-0">
                  <div className="flex items-center space-x-1 mb-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(user.transactionSpent)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Total spent</p>
                  {user.status !== 'active' && (
                    <span className="inline-block mt-1 px-2 py-1 bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 rounded text-xs capitalize">
                      {user.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6 pt-4 border-t border-border/30">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => fetchUsers(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => fetchUsers(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Showing {users.length} user{users.length !== 1 ? 's' : ''} out of{' '}
            {pagination?.totalCount || 0} total. Users are ordered by join date,
            most recent first.
          </p>
        </div>
      </div>
    </div>
  );
}
