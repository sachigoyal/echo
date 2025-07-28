import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  UserManager,
  User,
  UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client-ts';
import { EchoConfig, EchoUser, EchoBalance } from '../types';
import { sanitizeUserProfile } from '../utils/security';
import { EchoClient } from '@zdql/echo-typescript-sdk';
import type { Balance } from '@zdql/echo-typescript-sdk';

interface EchoOAuthProfile {
  sub?: string;
  user_id?: string;
  id?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  picture?: string;
}

export interface EchoContextValue {
  user: EchoUser | null;
  balance: EchoBalance | null;
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

export const EchoContext = createContext<EchoContextValue | undefined>(
  undefined
);

interface EchoProviderProps {
  config: EchoConfig;
  children: ReactNode;
}

export function EchoProvider({ config, children }: EchoProviderProps) {
  const [user, setUser] = useState<EchoUser | null>(null);
  const [balance, setBalance] = useState<EchoBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userManager, setUserManager] = useState<UserManager | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize UserManager only on client-side
  useEffect(() => {
    if (!isClient) {
      return;
    }

    // Check for existing mock UserManager in tests
    const existingManager = (
      window as typeof window & { __echoUserManager?: UserManager }
    ).__echoUserManager;
    if (existingManager) {
      setUserManager(existingManager);
      return;
    }

    const apiUrl = config.apiUrl || 'http://localhost:3000';
    const settings: UserManagerSettings = {
      authority: apiUrl,
      client_id: config.appId,
      redirect_uri: config.redirectUri || window.location.origin,
      scope: config.scope || 'llm:invoke offline_access',

      // Automatic token renewal configuration
      automaticSilentRenew: true,
      accessTokenExpiringNotificationTimeInSeconds: 60,
      silentRequestTimeoutInSeconds: 10,

      // Silent renewal configuration
      silent_redirect_uri: config.redirectUri || window.location.origin,
      includeIdTokenInSilentRenew: false, // Default is false
      validateSubOnSilentRenew: true, // Default is true

      // UserInfo endpoint configuration
      loadUserInfo: true,

      // Custom OAuth endpoints (non-standard OIDC)
      metadata: {
        authorization_endpoint: `${apiUrl}/api/oauth/authorize`,
        token_endpoint: `${apiUrl}/api/oauth/token`,
        userinfo_endpoint: `${apiUrl}/api/oauth/userinfo`,
        issuer: apiUrl,
      },

      userStore: new WebStorageStateStore({ store: window.localStorage }),
    };
    const manager = new UserManager(settings);

    // Make UserManager available globally for JWT testing
    (window as Window & { __echoUserManager?: UserManager }).__echoUserManager =
      manager;

    setUserManager(manager);
  }, [isClient, config.appId, config.apiUrl, config.redirectUri, config.scope]);

  const isAuthenticated = user !== null;

  // Create EchoClient with OAuth access token as API key
  const createClientWithToken = useCallback(
    (accessToken: string) => {
      const client = new EchoClient({
        baseUrl: config.apiUrl || 'http://localhost:3000',
        apiKey: accessToken,
      });
      return client;
    },
    [config.apiUrl]
  );

  // Convert OIDC user to Echo user format with security sanitization
  const convertUser = async (oidcUser: User): Promise<EchoUser> => {
    // With loadUserInfo: true, the OIDC library automatically calls the UserInfo endpoint
    // and merges the data into oidcUser.profile, so we just use that directly
    const profile = oidcUser.profile as EchoOAuthProfile;

    // Sanitize user profile data to prevent XSS attacks
    const rawProfile = {
      name:
        profile?.name ||
        profile?.given_name ||
        profile?.preferred_username ||
        profile?.email ||
        'User',
      email: profile?.email || profile?.preferred_username || '',
      picture: profile?.picture || '',
    };

    const sanitizedProfile = sanitizeUserProfile(rawProfile);

    return {
      id: profile?.sub || profile?.user_id || profile?.id || 'unknown',
      email: sanitizedProfile.email,
      name: sanitizedProfile.name || 'User',
      picture: sanitizedProfile.picture,
    };
  };

  // Load user data (profile + balance)
  const loadUserData = useCallback(
    async (oidcUser: User) => {
      try {
        setError(null);
        const echoUser = await convertUser(oidcUser);
        setUser(echoUser);
        setToken(oidcUser.access_token);

        // Create client with access token and fetch balance
        const client = createClientWithToken(oidcUser.access_token);
        await loadBalanceWithClient(client);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load user data';
        setError(errorMessage);
        console.error('Error loading user data:', err);
      }
    },
    [createClientWithToken]
  );

  // Load balance using EchoClient
  const loadBalanceWithClient = useCallback(async (client: EchoClient) => {
    try {
      const balanceData: Balance = await client.getBalance();
      setBalance({
        credits: balanceData.balance,
        currency: 'USD', // Default currency as it's not in the Balance interface
      });
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  }, []);

  // Sign in
  const signIn = async () => {
    if (!userManager) {
      throw new Error('UserManager not initialized');
    }
    await userManager.signinRedirect();
  };

  // Sign out
  const signOut = async () => {
    try {
      if (!userManager) {
        throw new Error('UserManager not initialized');
      }

      // Clear local state immediately
      setUser(null);
      setBalance(null);
      setToken(null);
      setError(null);

      // Remove user from storage
      await userManager.removeUser();

      // Attempt redirect (may fail in test environment)
      await userManager.signoutRedirect();
    } catch (error) {
      console.warn('Sign out redirect failed:', error);
      // State already cleared above
    }
  };

  // Clear authentication state (for error recovery)
  const clearAuth = useCallback(async () => {
    try {
      setUser(null);
      setBalance(null);
      setToken(null);
      setError(null);

      if (userManager) {
        await userManager.removeUser();
      }
    } catch (error) {
      console.warn('Error clearing auth state:', error);
    }
  }, [userManager]);

  // Enhanced method to attempt token refresh and retry an operation

  // Refresh balance using EchoClient with retry logic
  const refreshBalance = async () => {
    if (!userManager) {
      return;
    }
    const currentUser = await userManager.getUser();
    if (currentUser?.access_token) {
      const client = createClientWithToken(currentUser.access_token);
      await loadBalanceWithClient(client);
    }
  };

  // Create payment link using EchoClient
  const createPaymentLink = useCallback(
    async (
      amount: number,
      description?: string,
      successUrl?: string
    ): Promise<string> => {
      if (!userManager) {
        throw new Error('UserManager not initialized');
      }
      const currentUser = await userManager.getUser();
      if (!currentUser?.access_token) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);
        const client = createClientWithToken(currentUser.access_token);
        const url = await client.getPaymentUrl(
          amount,
          description || 'Echo Credits',
          successUrl
        );
        return url;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create payment link';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [userManager, createClientWithToken]
  );

  // Initialize and handle OAuth callback
  useEffect(() => {
    const initializeAuth = async () => {
      // If not on client-side, just set loading to false
      if (!isClient) {
        setIsLoading(false);
        return;
      }

      if (!userManager) {
        return; // Keep loading until userManager is initialized
      }

      try {
        setIsLoading(true);
        setError(null);

        // Handle OAuth callback - check for authorization code in query params anywhere
        if (window.location.search.includes('code=')) {
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
  }, [isClient, userManager, loadUserData]);

  // Set up event listeners for token events
  useEffect(() => {
    if (!userManager) {
      return;
    }

    const handleUserLoaded = (oidcUser: User) => {
      loadUserData(oidcUser);
    };

    const handleUserUnloaded = () => {
      console.log('User unloaded, clearing state');
      setUser(null);
      setBalance(null);
      setToken(null);
    };

    const handleAccessTokenExpiring = () => {
      console.log('Access token expiring, refreshing');
      userManager.signinSilent();
    };

    const handleAccessTokenExpired = async () => {
      console.log('Access token expired, reauthenticating');
      await userManager.signinSilent();
    };

    const handleSilentRenewError = async (err: Error) => {
      console.error('Silent renew failed:', err);
      await clearAuth();
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
  }, [userManager, loadUserData, clearAuth]);

  const contextValue: EchoContextValue = {
    user,
    balance,
    isAuthenticated,
    isLoading,
    error,
    token,
    signIn,
    signOut,
    refreshBalance,
    createPaymentLink,
    getToken: async () => {
      if (!userManager) {
        throw new Error('UserManager not initialized');
      }
      const currentUser = await userManager.getUser();
      return currentUser?.access_token || null;
    },
    clearAuth,
  };

  return (
    <EchoContext.Provider value={contextValue}>{children}</EchoContext.Provider>
  );
}
