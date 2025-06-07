import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { UserManager, User, UserManagerSettings } from 'oidc-client-ts';
import { EchoConfig, EchoUser, EchoBalance } from '../types';

export interface EchoContextValue {
  user: EchoUser | null;
  balance: EchoBalance | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  createPaymentLink: (amount: number) => Promise<string>;
}

export const EchoContext = createContext<EchoContextValue | null>(null);

interface EchoProviderProps {
  config: EchoConfig;
  children: ReactNode;
}

export function EchoProvider({ config, children }: EchoProviderProps) {
  const [user, setUser] = useState<EchoUser | null>(null);
  const [balance, setBalance] = useState<EchoBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userManager] = useState(() => {
    const settings: UserManagerSettings = {
      authority: config.apiUrl || 'http://localhost:3000',
      client_id: config.instanceId,
      redirect_uri:
        config.redirectUri || `${window.location.origin}/echo/callback`,
      response_type: 'code',
      scope: 'openid profile',
      automaticSilentRenew: true,
      includeIdTokenInSilentRenew: false,
      // Custom metadata since Echo might not be fully OIDC compliant yet
      metadata: {
        authorization_endpoint: `${config.apiUrl || 'http://localhost:3000'}/oauth/authorize`,
        token_endpoint: `${config.apiUrl || 'http://localhost:3000'}/oauth/token`,
        issuer: config.apiUrl || 'http://localhost:3000',
        userinfo_endpoint: `${config.apiUrl || 'http://localhost:3000'}/api/user`,
      },
    };
    return new UserManager(settings);
  });

  const isAuthenticated = user !== null;

  // Convert OIDC user to Echo user format
  const convertUser = (oidcUser: User): EchoUser => ({
    id: oidcUser.profile.sub,
    email: oidcUser.profile.email || '',
    name: oidcUser.profile.name || oidcUser.profile.email || '',
  });

  // Load user data (profile + balance)
  const loadUserData = useCallback(
    async (oidcUser: User) => {
      try {
        setError(null);
        const echoUser = convertUser(oidcUser);
        setUser(echoUser);

        // Fetch balance using access token
        const response = await fetch(
          `${config.apiUrl || 'http://localhost:3000'}/api/balance`,
          {
            headers: {
              Authorization: `Bearer ${oidcUser.access_token}`,
            },
          }
        );

        if (response.ok) {
          const balanceData = await response.json();
          setBalance(balanceData);
        } else {
          console.warn('Failed to fetch balance:', response.statusText);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load user data';
        setError(errorMessage);
        console.error('Error loading user data:', err);
      }
    },
    [config.apiUrl]
  );

  // Sign in
  const signIn = useCallback(async () => {
    try {
      setError(null);
      await userManager.signinRedirect();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      console.error('Sign in error:', err);
    }
  }, [userManager]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setError(null);
      await userManager.signoutRedirect();
      setUser(null);
      setBalance(null);
    } catch (err) {
      // Fallback: clear local state even if redirect fails
      await userManager.removeUser();
      setUser(null);
      setBalance(null);
      const errorMessage =
        err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      console.error('Sign out error:', err);
    }
  }, [userManager]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    const currentUser = await userManager.getUser();
    if (!currentUser?.access_token) return;

    try {
      setError(null);
      const response = await fetch(
        `${config.apiUrl || 'http://localhost:3000'}/api/balance`,
        {
          headers: {
            Authorization: `Bearer ${currentUser.access_token}`,
          },
        }
      );

      if (response.ok) {
        const balanceData = await response.json();
        setBalance(balanceData);
      } else {
        throw new Error(`Failed to refresh balance: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh balance';
      setError(errorMessage);
      console.error('Error refreshing balance:', err);
    }
  }, [userManager, config.apiUrl]);

  // Create payment link
  const createPaymentLink = useCallback(
    async (amount: number): Promise<string> => {
      const currentUser = await userManager.getUser();
      if (!currentUser?.access_token) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);
        const response = await fetch(
          `${config.apiUrl || 'http://localhost:3000'}/api/stripe/payment-link`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser.access_token}`,
            },
            body: JSON.stringify({ amount }),
          }
        );

        if (response.ok) {
          const { url } = await response.json();
          return url;
        } else {
          throw new Error(
            `Failed to create payment link: ${response.statusText}`
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create payment link';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [userManager, config.apiUrl]
  );

  // Initialize and handle OAuth callback
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Handle OAuth callback
        if (
          window.location.pathname.includes('/echo/callback') ||
          window.location.search.includes('code=')
        ) {
          const oidcUser = await userManager.signinRedirectCallback();
          await loadUserData(oidcUser);
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } else {
          // Check for existing session
          const oidcUser = await userManager.getUser();
          if (oidcUser && !oidcUser.expired) {
            await loadUserData(oidcUser);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Authentication initialization failed';
        setError(errorMessage);
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [userManager, loadUserData]);

  // Set up event listeners for token events
  useEffect(() => {
    const handleUserLoaded = (oidcUser: User) => {
      loadUserData(oidcUser);
    };

    const handleUserUnloaded = () => {
      setUser(null);
      setBalance(null);
    };

    const handleAccessTokenExpiring = () => {
      console.log('Access token expiring, will attempt silent renewal');
    };

    const handleAccessTokenExpired = () => {
      console.log('Access token expired');
      setError('Session expired. Please sign in again.');
    };

    const handleSilentRenewError = (err: Error) => {
      console.error('Silent renew failed:', err);
      setError('Session renewal failed. Please sign in again.');
    };

    userManager.events.addUserLoaded(handleUserLoaded);
    userManager.events.addUserUnloaded(handleUserUnloaded);
    userManager.events.addAccessTokenExpiring(handleAccessTokenExpiring);
    userManager.events.addAccessTokenExpired(handleAccessTokenExpired);
    userManager.events.addSilentRenewError(handleSilentRenewError);

    return () => {
      userManager.events.removeUserLoaded(handleUserLoaded);
      userManager.events.removeUserUnloaded(handleUserUnloaded);
      userManager.events.removeAccessTokenExpiring(handleAccessTokenExpiring);
      userManager.events.removeAccessTokenExpired(handleAccessTokenExpired);
      userManager.events.removeSilentRenewError(handleSilentRenewError);
    };
  }, [userManager, loadUserData]);

  const contextValue: EchoContextValue = {
    user,
    balance,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    refreshBalance,
    createPaymentLink,
  };

  return (
    <EchoContext.Provider value={contextValue}>{children}</EchoContext.Provider>
  );
}
