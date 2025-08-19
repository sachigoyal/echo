import {
  EchoClient,
  OAuthTokenProvider,
} from '@merit-systems/echo-typescript-sdk';
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';

interface UseEchoClientOptions {
  apiUrl: string;
}

/**
 * Custom hook for managing EchoClient lifecycle
 * Handles client creation, token management, and cleanup
 */
export function useEchoClient({ apiUrl }: UseEchoClientOptions) {
  const auth = useAuth();
  const [client, setClient] = useState<EchoClient | null>(null);

  useEffect(() => {
    // Only recreate client when authentication state changes, not token refresh
    if (!auth.isAuthenticated || !auth.user) {
      setClient(null);
      return;
    }

    // Create client once when authenticated - token provider handles refresh internally
    const tokenProvider = new OAuthTokenProvider({
      getTokenFn: () => Promise.resolve(auth.user?.access_token || null),
      refreshTokenFn: async () => {
        await auth.signinSilent();
      },
      onRefreshErrorFn: (error: Error) => {
        console.error('Token refresh failed:', error);
        auth.signoutSilent();
      },
    });

    const newClient = new EchoClient({
      baseUrl: apiUrl,
      tokenProvider,
    });

    setClient(newClient);

    return () => {
      setClient(null);
    };
  }, [
    apiUrl,
    auth.isAuthenticated,
    auth.user?.profile?.sub, // Only recreate if user ID changes
    auth.signinSilent,
    auth.signoutSilent,
  ]);

  return client;
}
