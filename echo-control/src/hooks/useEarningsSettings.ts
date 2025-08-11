import { useState, useEffect, useCallback } from 'react';

interface EarningsTransaction {
  id: string;
  model: string;
  providerId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  apiKey?: {
    id: string;
    name?: string;
  } | null;
}

interface EarningsPaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface EarningsSummary {
  totalCost: number;
  totalTokens: number;
  transactionCount: number;
}

interface EarningsResponse {
  transactions: EarningsTransaction[];
  pagination: EarningsPaginationInfo;
  summary: EarningsSummary;
}

interface UseEarningsSettingsReturn {
  transactions: EarningsTransaction[];
  loading: boolean;
  error: string | null;
  pagination: EarningsPaginationInfo | null;
  summary: EarningsSummary | null;
  fetchEarnings: (page?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEarningsSettings(appId: string): UseEarningsSettingsReturn {
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<EarningsPaginationInfo | null>(
    null
  );
  const [summary, setSummary] = useState<EarningsSummary | null>(null);

  const fetchEarnings = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/owner/apps/${appId}/earnings?page=${page}&limit=10`
        );

        if (response.ok) {
          const data: EarningsResponse = await response.json();
          setTransactions(data.transactions);
          setPagination(data.pagination);
          setSummary(data.summary);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch earnings');
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load earnings'
        );
      } finally {
        setLoading(false);
      }
    },
    [appId]
  );

  const refresh = useCallback(async () => {
    const currentPage = pagination?.page || 1;
    await fetchEarnings(currentPage);
  }, [fetchEarnings, pagination?.page]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    transactions,
    loading,
    error,
    pagination,
    summary,
    fetchEarnings,
    refresh,
  };
}

export type {
  EarningsTransaction,
  EarningsPaginationInfo,
  EarningsSummary,
  EarningsResponse,
};
