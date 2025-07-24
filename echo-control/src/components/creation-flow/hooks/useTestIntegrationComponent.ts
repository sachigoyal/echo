import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseTestIntegrationComponentReturn {
  integrationVerified: boolean;
  isPolling: boolean;
  startPolling: (appId: string) => void;
  update: () => Promise<void>;
  canGoNext: boolean;
  isUpdating: boolean;
  error: string | null;
}

export function useTestIntegrationComponent(
  appId: string
): UseTestIntegrationComponentReturn {
  const [integrationVerified, setIntegrationVerified] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to store timer IDs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // For this step, isUpdating is the same as isPolling
  const isUpdating = isPolling;

  // This step can always proceed (it's verification/informational)
  const canGoNext = true;

  // Cleanup function to clear all timers
  const clearTimers = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  const checkForRefreshToken = useCallback(
    async (appId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/owner/apps/${appId}/refresh-tokens`);
        const data = await response.json();

        // Check if there are any active refresh tokens for this app
        return data.hasActiveTokens || false;
      } catch (error) {
        console.error('Error checking refresh token:', error);
        setError('Failed to check integration status');
        return false;
      }
    },
    []
  );

  const startPolling = useCallback(
    (appId: string) => {
      // Clear any existing timers before starting new ones
      clearTimers();

      setIsPolling(true);
      setError(null);

      pollingIntervalRef.current = setInterval(async () => {
        const hasTokens = await checkForRefreshToken(appId);
        if (hasTokens) {
          setIntegrationVerified(true);
          setIsPolling(false);
          clearTimers();
        }
      }, 3000); // Poll every 3 seconds

      // Stop polling after 5 minutes
      pollingTimeoutRef.current = setTimeout(() => {
        clearTimers();
        setIsPolling(false);
      }, 300000);
    },
    [checkForRefreshToken, clearTimers]
  );

  // Update method (no-op for test step as it's verification only)
  const handleUpdate = useCallback(async (): Promise<void> => {
    // Test step doesn't need to update anything
    return Promise.resolve();
  }, []);

  // Auto-start polling when component mounts and we have a created app
  useEffect(() => {
    if (appId && !isPolling && !integrationVerified) {
      startPolling(appId);
    }
  }, [appId, isPolling, integrationVerified, startPolling]);

  // Reset test state when appId changes
  useEffect(() => {
    setIntegrationVerified(false);
    setIsPolling(false);
    setError(null);
    clearTimers(); // Clear timers when appId changes
  }, [appId, clearTimers]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    integrationVerified,
    isPolling,
    startPolling,
    update: handleUpdate,
    canGoNext,
    isUpdating,
    error,
  };
}
