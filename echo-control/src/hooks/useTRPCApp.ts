'use client';

import { api } from '@/trpc/react';

import type {
  PublicEchoApp,
  CustomerEchoApp,
  OwnerEchoApp,
  EchoApp,
} from '@/lib/types/apps';

interface UseTRPCAppReturn {
  app: EchoApp | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Hook to fetch a single app with appropriate permissions
 * Returns different data based on user's role
 */
export function useTRPCApp(appId: string): UseTRPCAppReturn {
  const query = api.apps.getApp.useQuery(
    { appId },
    {
      enabled: !!appId,
      staleTime: 0,
    }
  );

  return {
    app: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseTRPCOwnerAppReturn {
  app: OwnerEchoApp | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Hook to fetch an app as owner (requires owner permissions)
 */
export function useTRPCOwnerApp(appId: string): UseTRPCOwnerAppReturn {
  const query = api.apps.getOwnerApp.useQuery(
    { appId },
    {
      enabled: !!appId,
      staleTime: 0,
    }
  );

  return {
    app: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseTRPCCustomerAppReturn {
  app: CustomerEchoApp | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Hook to fetch an app as customer (requires customer permissions)
 */
export function useTRPCCustomerApp(appId: string): UseTRPCCustomerAppReturn {
  const query = api.apps.getCustomerApp.useQuery(
    { appId },
    {
      enabled: !!appId,
      staleTime: 0,
    }
  );

  return {
    app: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseTRPCPublicAppReturn {
  app: PublicEchoApp | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Hook to fetch a public app
 */
export function useTRPCPublicApp(appId: string): UseTRPCPublicAppReturn {
  const query = api.apps.getPublicApp.useQuery(
    { appId },
    {
      enabled: !!appId,
      staleTime: 0,
    }
  );

  return {
    app: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
