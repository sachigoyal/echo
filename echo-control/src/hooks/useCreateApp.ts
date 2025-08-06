import { useCallback, useState } from 'react';
import { OwnerEchoApp } from '../lib/apps/types';

export interface CreateAppData {
  name: string;
  callbackUrl?: string;
  githubType?: 'user' | 'repo';
  githubId?: string;
}

export interface UseCreateAppReturn {
  createApp: (data: CreateAppData) => Promise<OwnerEchoApp>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
  createdApp: OwnerEchoApp | null;
}

export function useCreateApp(): UseCreateAppReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdApp, setCreatedApp] = useState<OwnerEchoApp | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createApp = useCallback(
    async (data: CreateAppData): Promise<OwnerEchoApp> => {
      try {
        setIsCreating(true);
        setError(null);

        console.log('Creating app with data:', data);

        const response = await fetch('/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            authorizedCallbackUrls: data.callbackUrl ? [data.callbackUrl] : [],
            githubType: data.githubId ? data.githubType : undefined,
            githubId: data.githubId || undefined,
          }),
        });

        const detailedApp = await response.json();

        if (!response.ok) {
          throw new Error(detailedApp.error || 'Failed to create echo app');
        }

        console.log('App created successfully:', detailedApp);

        setCreatedApp(detailedApp);

        return detailedApp;
      } catch (error) {
        console.error('Error creating app:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create echo app';
        setError(errorMessage);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return {
    createApp,
    isCreating,
    error,
    clearError,
    createdApp,
  };
}
