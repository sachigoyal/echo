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
    if (!auth.user?.access_token) {
      setClient(null);
      return;
    }

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
  }, [apiUrl, auth.user?.access_token, auth.signinSilent, auth.signoutSilent]);

  return client;
}
