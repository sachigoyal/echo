'use client';

import { useState, useCallback } from 'react';
import { PublicEchoApp } from '@/lib/types/apps';

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UsePublicAppsReturn {
  apps: PublicEchoApp[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  fetchPublicApps: (page?: number, limit?: number) => Promise<PublicEchoApp[]>;
  refetch: (page?: number, limit?: number) => Promise<PublicEchoApp[]>;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
}

export function usePublicApps(): UsePublicAppsReturn {
  const [apps, setApps] = useState<PublicEchoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchPublicApps = useCallback(
    async (page = 1, limit = 10): Promise<PublicEchoApp[]> => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL('/api/apps/public', window.location.origin);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', limit.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }

        const data = await response.json();

        // Handle paginated response structure
        const publicApps = (data.apps as PublicEchoApp[]).filter(
          (app: PublicEchoApp) => app.isActive
        );

        setApps(publicApps);
        setPagination({
          totalCount: data.totalCount,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
          hasNextPage: data.hasNextPage,
          hasPreviousPage: data.hasPreviousPage,
        });

        return publicApps;
      } catch (err) {
        console.error('Error fetching public apps:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch public apps';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const nextPage = useCallback(async () => {
    if (pagination.hasNextPage) {
      await fetchPublicApps(pagination.currentPage + 1);
    }
  }, [fetchPublicApps, pagination.hasNextPage, pagination.currentPage]);

  const previousPage = useCallback(async () => {
    if (pagination.hasPreviousPage) {
      await fetchPublicApps(pagination.currentPage - 1);
    }
  }, [fetchPublicApps, pagination.hasPreviousPage, pagination.currentPage]);

  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        await fetchPublicApps(page);
      }
    },
    [fetchPublicApps, pagination.totalPages]
  );

  return {
    apps,
    loading,
    error,
    pagination,
    fetchPublicApps,
    refetch: fetchPublicApps,
    nextPage,
    previousPage,
    goToPage,
  };
}
