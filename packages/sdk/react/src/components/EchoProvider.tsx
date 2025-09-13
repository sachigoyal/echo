import {
  UserManager, WebStorageStateStore
} from 'oidc-client-ts';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AuthProvider,
  AuthProviderUserManagerProps,
  useAuth,
} from 'react-oidc-context';
import type { EchoClient } from '@merit-systems/echo-typescript-sdk';
import type { User } from 'oidc-client-ts';
import { useEchoBalance } from '../hooks/useEchoBalance';
import { useEchoClient } from '../hooks/useEchoClient';
import { useEchoPayments } from '../hooks/useEchoPayments';
import { useEchoUser } from '../hooks/useEchoUser';
import { EchoAuthConfig } from '../types';
import { EchoContext, EchoContextValue, EchoRefreshContext, EchoRefreshContextValue } from '../context';


interface EchoProviderInternalProps {
  children: ReactNode;

  config: EchoAuthConfig;

  rawUser: User | null | undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
  authError: Error | null | undefined;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;

  echoClient: EchoClient | null;
}

// Internal provider that handles everything
function EchoProviderInternal({
  config,
  children,

  rawUser,
  isLoggedIn,
  isLoading,
  authError,
  echoClient,

  signIn,
  signOut,
  getToken
}: EchoProviderInternalProps) {
  // Insufficient funds state - shared across all components
  const [isInsufficientFunds, setIsInsufficientFunds] = useState(false);

  const {
    balance,
    freeTierBalance,
    refreshBalance,
    error: balanceError,
    isLoading: balanceLoading,
  } = useEchoBalance(echoClient, config.appId);

  const {
    user: echoUser,
    error: userError,
    isLoading: userLoading,
  } = useEchoUser(echoClient);

  const {
    createPaymentLink,
    error: paymentError,
    isLoading: paymentLoading,
  } = useEchoPayments(echoClient);


  // Combine errors from different sources
  const combinedError =
    authError?.message || balanceError || paymentError || userError || null;

  // Only include isLoading for initial authentication, not token refresh
  // Token refresh should be transparent to downstream components
  const isInitialAuthLoading = isLoading && !isLoggedIn;
  const isTokenRefreshing = isLoading && isLoggedIn;
  const combinedLoading =
    isInitialAuthLoading || balanceLoading || paymentLoading || userLoading;

  // Main context - stable during token refresh
  const contextValue: EchoContextValue = useMemo(
    () => ({
      user: echoUser,
      rawUser,
      balance,
      freeTierBalance,
      isLoggedIn,
      isLoading: combinedLoading,
      error: combinedError,
      echoClient,
      signIn: signIn,
      signOut: signOut,
      refreshBalance,
      createPaymentLink,
      getToken,
      config,
      isInsufficientFunds,
      setIsInsufficientFunds,
    }),
    [
      echoUser,
      rawUser,
      balance,
      freeTierBalance,
      isLoggedIn,
      combinedLoading,
      combinedError,
      echoClient,
      signIn,
      signOut,
      refreshBalance,
      createPaymentLink,
      getToken,
      config,
      isInsufficientFunds,
    ]
  );

  // Separate refresh context - only components that need refresh state will re-render
  const refreshContextValue: EchoRefreshContextValue = useMemo(
    () => ({
      isRefreshing: isTokenRefreshing,
    }),
    [isTokenRefreshing]
  );

  return (
    <EchoContext.Provider value={contextValue}>
      <EchoRefreshContext.Provider value={refreshContextValue}>
        {children}
      </EchoRefreshContext.Provider>
    </EchoContext.Provider>
  );
}

// Intermediate provider that uses auth and creates EchoClient
function EchoProviderWithAuth({ config, children }: EchoProviderProps) {
  const auth = useAuth();
  const apiUrl = config.baseEchoUrl || 'https://echo.merit.systems';
  const echoClient = useEchoClient({ apiUrl });

  const signOut = useCallback(async () => {
    try {
      await auth.removeUser();
    } catch (err) {
      console.error('Error during auth cleanup:', err);
    }
  }, [auth.removeUser]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (auth.user?.expired) {
      return (await auth.signinSilent())?.access_token || null;
    }
    return auth.user?.access_token || null;
  }, [auth.user?.access_token, auth.signinSilent]);

  const isLoggedIn = !!auth.user;

  return (
    <EchoProviderInternal
      config={config}
      rawUser={auth.user}
      isLoggedIn={isLoggedIn}
      isLoading={auth.isLoading}
      authError={auth.error}
      echoClient={echoClient}
      signIn={auth.signinRedirect}
      signOut={signOut}
      getToken={getToken}
    >
      {children}
    </EchoProviderInternal>
  );
}


interface EchoProviderProps {
  config: EchoAuthConfig;
  children: ReactNode;
}

// Main provider that wraps react-oidc-context
export function EchoProvider({ config, children }: EchoProviderProps) {
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting for SSR compatibility
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render on server-side
  if (!isClient) {
    return null;
  }

  const apiUrl = config.baseEchoUrl || 'https://echo.merit.systems';

  const oidcConfig: AuthProviderUserManagerProps = {
    userManager:
      (typeof window !== 'undefined' && (window as any).__echoUserManager) ||
      new UserManager({
        authority: apiUrl,
        client_id: config.appId,
        redirect_uri: config.redirectUri || window.location.origin,
        scope: config.scope || 'llm:invoke offline_access',
        silentRequestTimeoutInSeconds: 10,
        automaticSilentRenew: true,

        // Silent renewal configuration
        silent_redirect_uri: config.redirectUri || window.location.origin,
        includeIdTokenInSilentRenew: false,

        validateSubOnSilentRenew: true,

        // UserInfo endpoint configuration
        loadUserInfo: true,

        // Custom OAuth endpoints (non-standard OIDC)
        metadata: {
          authorization_endpoint: `${apiUrl}/api/oauth/authorize`,
          token_endpoint: `${apiUrl}/api/oauth/token`,
          userinfo_endpoint: `${apiUrl}/api/oauth/userinfo`,
          issuer: apiUrl,
          jwks_uri: `${apiUrl}/.well-known/jwks.json`,
          end_session_endpoint: `${apiUrl}/api/oauth/logout`,
        },
        userStore: new WebStorageStateStore({ store: window.localStorage }),
      }),

    // Remove URL parameters after successful authentication
    onSigninCallback: () => {
      // Clean up URL after auth
      if (window.location.search.includes('code=')) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    },
  };

  return (
    <AuthProvider {...oidcConfig}>
      <EchoProviderWithAuth config={config}>{children}</EchoProviderWithAuth>
    </AuthProvider>
  );
}
