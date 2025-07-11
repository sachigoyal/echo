import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface CreateAppData {
  name: string;
  callbackUrl?: string;
  githubType?: 'user' | 'repo';
  githubId?: string;
}

export interface CreatedApp {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  authorizedCallbackUrls: string[];
  githubType?: 'user' | 'repo';
  githubId?: string;
}

export interface UseCreateAppReturn {
  createApp: (data: CreateAppData) => Promise<string>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
  createdAppId: string | null;
}

export function useCreateApp(): UseCreateAppReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createApp = useCallback(
    async (data: CreateAppData): Promise<string> => {
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

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to create echo app');
        }

        console.log('App created successfully:', responseData);

        setCreatedAppId(responseData.id);

        // Update URL with the created app ID
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('appId', responseData.id);
        router.replace(currentUrl.pathname + currentUrl.search);

        return responseData.id;
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
    createdAppId,
  };
}
