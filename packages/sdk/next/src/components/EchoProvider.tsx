'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { EchoProviderRaw } from '@merit-systems/echo-react-sdk/advanced';
import type { EchoUser } from '@merit-systems/echo-react-sdk';
import { EchoClient } from '@merit-systems/echo-typescript-sdk';

export interface EchoProxyConfig {
  appId: string;
  basePath?: string; // default '/api/echo'
  initialSession?: { isAuthenticated: boolean; user?: EchoUser | null };
}

function useProxySession(
  basePath: string,
  initial?: EchoProxyConfig['initialSession']
) {
  const [state, setState] = useState<{
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    isAuthenticated: !!initial?.isAuthenticated,
    isLoading: !initial,
    error: null,
  });

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${basePath}/session`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Session ${res.status}`);
        const json = await res.json();
        if (!cancelled)
          setState({
            isAuthenticated: !!json.isAuthenticated,
            isLoading: false,
            error: null,
          });
      } catch (e: any) {
        if (!cancelled)
          setState({
            isAuthenticated: false,
            isLoading: false,
            error: e?.message ?? 'Session error',
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [basePath, initial]);

  return state;
}

interface EchoProviderProps {
  config: EchoProxyConfig;
  children: ReactNode;
}

export function EchoProvider({ config, children }: EchoProviderProps) {
  const basePath = config.basePath || '/api/echo';
  const session = useProxySession(basePath, config.initialSession);

  const echoClient = useMemo(
    () =>
      session.isAuthenticated
        ? new EchoClient({
            baseUrl: `${basePath}/proxy`,
            apiKey: 'next-sdk-proxy',
          })
        : null,
    [basePath, session.isAuthenticated]
  );

  const signIn = useCallback(async () => {
    const returnTo =
      typeof window !== 'undefined' ? window.location.href : undefined;
    const url = `${basePath}/signin${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`;
    window.location.href = url;
  }, [basePath]);

  const signOut = useCallback(async () => {
    window.location.href = `${basePath}/signout`;
  }, [basePath]);

  const getToken = useCallback(async () => null, []);

  return (
    <EchoProviderRaw
      config={{ appId: config.appId } as any}
      rawUser={null}
      isLoggedIn={session.isAuthenticated}
      isAuthLoading={session.isLoading}
      authError={session.error ? new Error(session.error) : null}
      echoClient={echoClient}
      signIn={signIn}
      signOut={signOut}
      getToken={getToken}
    >
      {children}
    </EchoProviderRaw>
  );
}
