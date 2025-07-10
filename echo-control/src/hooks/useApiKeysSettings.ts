import { useState, useEffect, useCallback } from 'react';

interface ApiKey {
  id: string;
  name: string;
  userId: string;
  echoAppId: string;
  scope: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface ApiKeysPaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ApiKeysResponse {
  apiKeys: ApiKey[];
  pagination: ApiKeysPaginationInfo;
}

interface UseApiKeysSettingsReturn {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  pagination: ApiKeysPaginationInfo | null;
  fetchApiKeys: (page?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useApiKeysSettings(appId: string): UseApiKeysSettingsReturn {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ApiKeysPaginationInfo | null>(
    null
  );

  const fetchApiKeys = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/owner/apps/${appId}/api-keys?page=${page}&limit=10`
        );

        if (response.ok) {
          const data: ApiKeysResponse = await response.json();
          setApiKeys(data.apiKeys);
          setPagination(data.pagination);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch API keys');
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load API keys'
        );
      } finally {
        setLoading(false);
      }
    },
    [appId]
  );

  const refresh = useCallback(async () => {
    const currentPage = pagination?.page || 1;
    await fetchApiKeys(currentPage);
  }, [fetchApiKeys, pagination?.page]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return {
    apiKeys,
    loading,
    error,
    pagination,
    fetchApiKeys,
    refresh,
  };
}

export type { ApiKey, ApiKeysPaginationInfo, ApiKeysResponse };
