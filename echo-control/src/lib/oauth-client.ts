/**
 * OAuth PKCE Client Library for Echo Apps
 *
 * This library helps Echo app frontends implement OAuth 2.0 PKCE flow
 * to authenticate with Echo Control and obtain API keys.
 */

import { createHash, randomBytes } from 'crypto';

export interface OAuthConfig {
  authorizationUrl: string; // e.g., 'https://echo.merit.systems/api/oauth/authorize'
  tokenUrl: string; // e.g., 'https://echo.merit.systems/api/oauth/token'
  clientId: string; // Your Echo app ID
  redirectUri: string; // Your app's callback URL
  scope?: string; // Default: 'llm:invoke offline_access'
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  scope: string;
  expires_in: number | null;
  refresh_token_expires_in?: number;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  echo_app: {
    id: string;
    name: string;
    description: string | null;
  };
}

export class EchoOAuthClient {
  private config: OAuthConfig;
  private codeVerifier: string | null = null;
  private codeChallenge: string | null = null;

  constructor(config: OAuthConfig) {
    this.config = {
      scope: 'llm:invoke offline_access',
      ...config,
    };
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    // Generate code verifier (43-128 characters, URL-safe)
    const codeVerifier = this.base64URLEncode(randomBytes(32));

    // Generate code challenge (SHA256 hash of verifier, base64url encoded)
    const hash = createHash('sha256').update(codeVerifier).digest();
    const codeChallenge = this.base64URLEncode(hash);

    return { codeVerifier, codeChallenge };
  }

  /**
   * Base64URL encode (RFC 4648)
   */
  private base64URLEncode(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate the authorization URL for the OAuth flow
   */
  getAuthorizationUrl(state?: string): string {
    const { codeVerifier, codeChallenge } = this.generatePKCE();

    // Store for later use in token exchange
    this.codeVerifier = codeVerifier;
    this.codeChallenge = codeChallenge;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      scope: this.config.scope || 'llm:invoke offline_access',
      ...(state && { state }),
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    if (!this.codeVerifier) {
      throw new Error(
        'Code verifier not found. Call getAuthorizationUrl() first.'
      );
    }

    const tokenRequest = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: this.codeVerifier,
    };

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Token exchange failed: ${error.error_description || error.error}`
      );
    }

    const tokenResponse: TokenResponse = await response.json();

    // Clear the code verifier after successful exchange
    this.codeVerifier = null;
    this.codeChallenge = null;

    return tokenResponse;
  }

  /**
   * Complete OAuth flow by parsing callback URL and exchanging code
   */
  async handleCallback(callbackUrl: string): Promise<TokenResponse> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      const errorDescription = url.searchParams.get('error_description');
      throw new Error(`OAuth error: ${errorDescription || error}`);
    }

    if (!code) {
      throw new Error('Authorization code not found in callback URL');
    }

    return this.exchangeCodeForToken(code);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const refreshRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const response = await fetch(
      this.config.tokenUrl.replace('/token', '/refresh'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refreshRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Token refresh failed: ${error.error_description || error.error}`
      );
    }

    return response.json();
  }
}

/**
 * Browser-specific utilities for OAuth flow
 */
export class BrowserOAuthClient extends EchoOAuthClient {
  private storageKey = 'echo_oauth_state';

  /**
   * Start OAuth flow by redirecting to authorization server
   */
  authorize(state?: string): void {
    const authUrl = this.getAuthorizationUrl(state);

    // Store OAuth state in sessionStorage for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        this.storageKey,
        JSON.stringify({
          state,
          timestamp: Date.now(),
        })
      );
      window.location.href = authUrl;
    }
  }

  /**
   * Handle the OAuth callback (call this on your redirect URI page)
   */
  async handleCallback(): Promise<TokenResponse> {
    if (typeof window === 'undefined') {
      throw new Error(
        'Browser OAuth client can only be used in browser environment'
      );
    }

    const currentUrl = window.location.href;
    const url = new URL(currentUrl);

    // Validate state parameter
    const returnedState = url.searchParams.get('state');
    const storedState = sessionStorage.getItem(this.storageKey);

    if (storedState) {
      const parsedState = JSON.parse(storedState);
      if (parsedState.state !== returnedState) {
        throw new Error('OAuth state mismatch - possible CSRF attack');
      }
      sessionStorage.removeItem(this.storageKey);
    }

    return super.handleCallback(currentUrl);
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * const client = new BrowserOAuthClient({
 *   authorizationUrl: 'https://echo.merit.systems/api/oauth/authorize',
 *   tokenUrl: 'https://echo.merit.systems/api/oauth/token',
 *   clientId: 'your-echo-app-id',
 *   redirectUri: 'http://localhost:3000/auth/callback',
 * });
 *
 * // Start OAuth flow
 * client.authorize();
 *
 * // On callback page
 * try {
 *   const token = await client.handleCallback();
 *   console.log('Access token:', token.access_token);
 *   console.log('Refresh token:', token.refresh_token);
 *
 *   // Store tokens
 *   localStorage.setItem('echo_access_token', token.access_token);
 *   localStorage.setItem('echo_refresh_token', token.refresh_token);
 * } catch (error) {
 *   console.error('OAuth failed:', error);
 * }
 *
 * // Later, refresh the access token
 * try {
 *   const refreshToken = localStorage.getItem('echo_refresh_token');
 *   const newToken = await client.refreshToken(refreshToken);
 *   localStorage.setItem('echo_access_token', newToken.access_token);
 *   localStorage.setItem('echo_refresh_token', newToken.refresh_token);
 * } catch (error) {
 *   console.error('Token refresh failed:', error);
 *   // Redirect to login
 * }
 * ```
 */
