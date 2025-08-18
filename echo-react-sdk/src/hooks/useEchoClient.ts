import {
  EchoClient,
  OidcTokenProvider,
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

    const tokenProvider = new OidcTokenProvider(
      () => Promise.resolve(auth.user?.access_token || null),
      async () => {
        await auth.signinSilent();
      },
      error => {
        console.error('Token refresh failed:', error);
        auth.signoutSilent();
      }
    );

    const newClient = new EchoClient({
      baseUrl: apiUrl,
      tokenProvider,
    });

    setClient(newClient);

    // Cleanup function
    return () => {
      // If EchoClient has cleanup methods, call them here in the future
      setClient(null);
    };
  }, [apiUrl, auth.user?.access_token, auth.signinSilent, auth.signoutSilent]);

  return client;
}
