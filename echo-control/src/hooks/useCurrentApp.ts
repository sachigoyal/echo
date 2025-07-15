import { useState, useEffect, useCallback } from 'react';
import { DetailedEchoApp } from '../lib/types/apps';

interface UseCurrentAppReturn {
  app: DetailedEchoApp | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateApp: (updates: Partial<DetailedEchoApp>) => void;
}

export function useCurrentApp(appId?: string): UseCurrentAppReturn {
  const [app, setApp] = useState<DetailedEchoApp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApp = useCallback(async () => {
    if (!appId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/apps/${appId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch app: ${response.statusText}`);
      }

      const appData = await response.json();
      setApp(appData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch app');
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  const refetch = useCallback(async () => {
    await fetchApp();
  }, [fetchApp]);

  const updateApp = useCallback(
    (updates: Partial<DetailedEchoApp>) => {
      if (!app) return;
      setApp(prev => (prev ? { ...prev, ...updates } : null));
    },
    [app]
  );

  useEffect(() => {
    if (appId) {
      fetchApp();
    }
  }, [appId, fetchApp]);

  return {
    app,
    isLoading,
    error,
    refetch,
    updateApp,
  };
}
