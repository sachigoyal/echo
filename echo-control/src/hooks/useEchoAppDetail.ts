'use client';

import { useCallback, useMemo } from 'react';

import { api } from '@/trpc/react';

import { AppRole, Permission } from '@/lib/permissions/types';
import { PermissionService } from '@/lib/permissions/service';

import type { EchoApp } from '@/lib/types/apps';

export interface UserPermissions {
  isAuthenticated: boolean;
  userRole: AppRole | null;
  permissions: Permission[];
}

export interface UseEchoAppDetailReturn {
  app: EchoApp | null;
  loading: boolean;
  error: string | null;
  userPermissions: UserPermissions;
  refetch: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

export function useEchoAppDetail(appId: string): UseEchoAppDetailReturn {
  // Use TRPC query to fetch app details
  // The server-side getApp function already handles permissions properly
  const {
    data: app,
    isLoading,
    error: queryError,
    refetch: trpcRefetch,
  } = api.apps.getApp.useQuery(
    { appId },
    {
      enabled: !!appId,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (
          error?.data?.code === 'NOT_FOUND' ||
          error?.data?.code === 'FORBIDDEN' ||
          error?.data?.code === 'UNAUTHORIZED'
        ) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

  // Determine user permissions based on app data
  const userPermissions = useMemo<UserPermissions>(() => {
    if (!app) {
      return {
        isAuthenticated: false,
        userRole: null,
        permissions: [],
      };
    }

    // Determine role based on app type
    let userRole: AppRole;
    if (app.type === 'owner') {
      userRole = AppRole.OWNER;
    } else if (app.type === 'customer') {
      // Could be CUSTOMER or ADMIN, but we'll use CUSTOMER as default
      // The server already handled the distinction
      userRole = AppRole.CUSTOMER;
    } else {
      userRole = AppRole.PUBLIC;
    }

    const isAuthenticated = userRole !== AppRole.PUBLIC;
    const permissions = PermissionService.getPermissionsForRole(userRole);

    return {
      isAuthenticated,
      userRole,
      permissions,
    };
  }, [app]);

  // Helper function to check if user has specific permission
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return userPermissions.permissions.includes(permission);
    },
    [userPermissions.permissions]
  );

  // Wrap refetch to match the expected Promise<void> signature
  const refetch = useCallback(async () => {
    await trpcRefetch();
  }, [trpcRefetch]);

  // Format error message
  const error = useMemo(() => {
    if (!queryError) return null;

    if (queryError.data?.code === 'NOT_FOUND') {
      return 'App not found';
    }
    if (
      queryError.data?.code === 'FORBIDDEN' ||
      queryError.data?.code === 'UNAUTHORIZED'
    ) {
      return 'You do not have permission to view this app';
    }

    return queryError.message || 'Failed to load app details';
  }, [queryError]);

  return {
    app: app || null,
    loading: isLoading,
    error,
    userPermissions,
    refetch,
    hasPermission,
  };
}
