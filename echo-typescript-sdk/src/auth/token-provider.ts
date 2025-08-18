/**
 * Interface for providing access tokens and refresh functionality
 */
export interface TokenProvider {
  /**
   * Get the current access token
   * @returns Promise that resolves to the access token or null if not available
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Refresh the access token when it expires or becomes invalid
   * @returns Promise that resolves when the token is refreshed
   */
  refreshToken(): Promise<void>;

  /**
   * Optional callback to be called when a token refresh fails
   * @param error The error that occurred during refresh
   */
  onRefreshError?(error: Error): void;
}

/**
 * Simple token provider that uses static API keys
 */
export class ApiKeyTokenProvider implements TokenProvider {
  constructor(private apiKey: string) {}

  async getAccessToken(): Promise<string | null> {
    return this.apiKey;
  }

  async refreshToken(): Promise<void> {
    // API keys don't need refreshing
    return Promise.resolve();
  }
}

/**
 * Token provider for OIDC-based authentication (like from React SDK)
 */
export class OidcTokenProvider implements TokenProvider {
  constructor(
    private getTokenFn: () => Promise<string | null>,
    private refreshTokenFn: () => Promise<void>,
    private onRefreshErrorFn?: (error: Error) => void
  ) {}

  async getAccessToken(): Promise<string | null> {
    return this.getTokenFn();
  }

  async refreshToken(): Promise<void> {
    return this.refreshTokenFn();
  }

  onRefreshError(error: Error): void {
    if (this.onRefreshErrorFn) {
      this.onRefreshErrorFn(error);
    }
  }
}
