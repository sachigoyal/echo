import type { FreeBalance } from '@merit-systems/echo-typescript-sdk';
import { EchoClient } from '@merit-systems/echo-typescript-sdk';
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import {
  createContext,
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
import { useEchoBalance } from '../hooks/useEchoBalance';
import { useEchoPayments } from '../hooks/useEchoPayments';
import { EchoBalance, EchoConfig, EchoUser } from '../types';

export interface EchoContextValue {
  // Auth & User
  rawUser: User | null | undefined; // directly piped from oidc
  user: EchoUser | null; // directly piped from oidc
  balance: EchoBalance | null;
  freeTierBalance: FreeBalance | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  createPaymentLink: (
    amount: number,
    description?: string,
    successUrl?: string
  ) => Promise<string>;
  getToken: () => Promise<string | null>;
  clearAuth: () => Promise<void>;
}

export const EchoContext = createContext<EchoContextValue | null>(null);

interface EchoProviderProps {
  config: EchoConfig;
  children: ReactNode;
}

// Internal provider that handles everything
function EchoProviderInternal({ config, children }: EchoProviderProps) {
  const auth = useAuth();

  const user = auth.user;
  const echoUser: EchoUser | null = user ? parseEchoUser(user) : null;
  const apiUrl = config.apiUrl || 'https://echo.merit.systems';
  const token = auth.user?.access_token || null;

  // Create EchoClient for business logic
  const echoClient = useMemo(() => {
    if (!token) return null;
    return new EchoClient({
      baseUrl: apiUrl,
      apiKey: token,
    });
  }, [apiUrl, token]);

  // Silent renew on focus
  useEffect(() => {
    const run = async () => {
      const exp = auth.user?.expires_at ?? 0;
      const now = Math.floor(Date.now() / 1000);
      if (exp - now < 180) {
        try {
          await auth.signinSilent();
        } catch {
          console.error('Error during silent renew');
        }
      }
    };
    const onFocus = () => {
      if (!document.hidden) void run();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [auth.user?.expires_at, auth]);

  const {
    balance,
    freeTierBalance,
    refreshBalance,
    error: balanceError,
    isLoading: balanceLoading,
  } = useEchoBalance(echoClient, config.appId);

  const {
    createPaymentLink,
    error: paymentError,
    isLoading: paymentLoading,
  } = useEchoPayments(echoClient);

  const clearAuth = useCallback(async () => {
    try {
      await auth.removeUser();
    } catch (err) {
      console.error('Error during auth cleanup:', err);
    }
  }, [auth.removeUser]);

  const getToken = useCallback(async (): Promise<string | null> => {
    return auth.user?.access_token || null;
  }, [auth.user?.access_token]);

  // Combine errors from different sources
  const combinedError =
    auth.error?.message || balanceError || paymentError || null;
  const combinedLoading = auth.isLoading || balanceLoading || paymentLoading;

  const contextValue: EchoContextValue = {
    user: echoUser || null,
    rawUser: user,
    balance,
    freeTierBalance,
    isAuthenticated: auth.isAuthenticated,
    isLoading: combinedLoading,
    error: combinedError,
    token,
    signIn: auth.signinRedirect,
    signOut: clearAuth,
    refreshBalance,
    createPaymentLink,
    getToken,
    clearAuth,
  };

  return (
    <EchoContext.Provider value={contextValue}>{children}</EchoContext.Provider>
  );
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

  const apiUrl = config.apiUrl || 'https://echo.merit.systems';

  const oidcConfig: AuthProviderUserManagerProps = {
    userManager: new UserManager({
      authority: apiUrl,
      client_id: config.appId,
      redirect_uri: config.redirectUri || window.location.origin,
      scope: config.scope || 'openid llm:invoke offline_access',
      silentRequestTimeoutInSeconds: 10,

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
      <EchoProviderInternal config={config}>{children}</EchoProviderInternal>
    </AuthProvider>
  );
}

function parseEchoUser(user: User): EchoUser {
  return {
    id: user.profile.sub || '',
    email: user.profile.email || '',
    name: user.profile.name || user.profile.preferred_username || '',
    picture: user.profile.picture || '',
  };
}
