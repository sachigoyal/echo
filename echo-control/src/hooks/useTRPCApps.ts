'use client';

import { trpc } from '@/components/providers/TRPCProvider';
import type {
  PublicEchoApp,
  CustomerEchoApp,
  OwnerEchoApp,
} from '@/lib/types/apps';
import { useState, useCallback } from 'react';

interface UseTRPCAppsOptions {
  initialPage?: number;
  initialLimit?: number;
  search?: string;
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseTRPCPublicAppsReturn {
  apps: PublicEchoApp[];
  pagination: PaginationInfo;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  search: string;
  updateSearch: (search: string) => void;
  limit: number;
  updateLimit: (limit: number) => void;
}

/**
 * Hook to fetch all public apps with pagination
 */
export function useTRPCPublicApps(
  options?: UseTRPCAppsOptions
): UseTRPCPublicAppsReturn {
  const [page, setPage] = useState(options?.initialPage ?? 1);
  const [limit, setLimit] = useState(options?.initialLimit ?? 10);
  const [search, setSearch] = useState(options?.search ?? '');

  const query = trpc.apps.getAllPublicApps.useQuery(
    { page, limit, search: search || undefined },
    {
      staleTime: 0,
    }
  );

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [query.data?.pagination.hasNextPage]);

  const previousPage = useCallback(() => {
    if (query.data?.pagination.hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [query.data?.pagination.hasPreviousPage]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (
        newPage >= 1 &&
        (!query.data || newPage <= query.data.pagination.totalPages)
      ) {
        setPage(newPage);
      }
    },
    [query.data]
  );

  const updateSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const updateLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
    apps: query.data?.apps ?? [],
    pagination: query.data?.pagination ?? {
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    nextPage,
    previousPage,
    goToPage,
    search,
    updateSearch,
    limit,
    updateLimit,
  };
}

interface UseTRPCCustomerAppsReturn {
  apps: CustomerEchoApp[];
  pagination: PaginationInfo;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  search: string;
  updateSearch: (search: string) => void;
  limit: number;
  updateLimit: (limit: number) => void;
}

/**
 * Hook to fetch all apps where the user is a customer
 */
export function useTRPCCustomerApps(
  options?: UseTRPCAppsOptions
): UseTRPCCustomerAppsReturn {
  const [page, setPage] = useState(options?.initialPage ?? 1);
  const [limit, setLimit] = useState(options?.initialLimit ?? 10);
  const [search, setSearch] = useState(options?.search ?? '');

  const query = trpc.apps.getAllCustomerApps.useQuery(
    { page, limit, search: search || undefined },
    {
      staleTime: 0,
    }
  );

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [query.data?.pagination.hasNextPage]);

  const previousPage = useCallback(() => {
    if (query.data?.pagination.hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [query.data?.pagination.hasPreviousPage]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (
        newPage >= 1 &&
        (!query.data || newPage <= query.data.pagination.totalPages)
      ) {
        setPage(newPage);
      }
    },
    [query.data]
  );

  const updateSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const updateLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
    apps: query.data?.apps ?? [],
    pagination: query.data?.pagination ?? {
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    nextPage,
    previousPage,
    goToPage,
    search,
    updateSearch,
    limit,
    updateLimit,
  };
}

interface UseTRPCOwnerAppsReturn {
  apps: OwnerEchoApp[];
  pagination: PaginationInfo;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  search: string;
  updateSearch: (search: string) => void;
  limit: number;
  updateLimit: (limit: number) => void;
}

/**
 * Hook to fetch all apps where the user is the owner
 */
export function useTRPCOwnerApps(
  options?: UseTRPCAppsOptions
): UseTRPCOwnerAppsReturn {
  const [page, setPage] = useState(options?.initialPage ?? 1);
  const [limit, setLimit] = useState(options?.initialLimit ?? 10);
  const [search, setSearch] = useState(options?.search ?? '');

  const query = trpc.apps.getAllOwnerApps.useQuery(
    { page, limit, search: search || undefined },
    {
      staleTime: 0,
    }
  );

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [query.data?.pagination.hasNextPage]);

  const previousPage = useCallback(() => {
    if (query.data?.pagination.hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [query.data?.pagination.hasPreviousPage]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (
        newPage >= 1 &&
        (!query.data || newPage <= query.data.pagination.totalPages)
      ) {
        setPage(newPage);
      }
    },
    [query.data]
  );

  const updateSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const updateLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
    apps: query.data?.apps ?? [],
    pagination: query.data?.pagination ?? {
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    nextPage,
    previousPage,
    goToPage,
    search,
    updateSearch,
    limit,
    updateLimit,
  };
}
