import { TEST_CONFIG } from '../config/index.js';
import { Balance, EchoClient } from '@zdql/echo-typescript-sdk';

export interface EchoControlApiClient {
  baseUrl: string;
  fetch: typeof fetch;
}

export class EchoControlApiClient {
  private integrationJwt: string | undefined;

  constructor(baseUrl: string = TEST_CONFIG.services.echoControl) {
    this.baseUrl = baseUrl;
    this.fetch = fetch;
    this.integrationJwt = TEST_CONFIG.auth.integrationJwt;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    return response.json();
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/health');
  }

  // OAuth endpoints
  async getOAuthAuthorizeUrl(params: {
    client_id: string;
    redirect_uri: string;
    state: string;
    code_challenge: string;
    code_challenge_method: string;
    scope?: string;
    prompt?: string;
  }): Promise<string> {
    const searchParams = new URLSearchParams(params);
    return `${this.baseUrl}/api/oauth/authorize?${searchParams.toString()}`;
  }

  // OAuth authorize validation (actually calls the endpoint for validation testing)
  async validateOAuthAuthorizeRequest(params: {
    client_id: string;
    redirect_uri: string;
    state: string;
    code_challenge: string;
    code_challenge_method: string;
    scope?: string;
    prompt?: string;
  }): Promise<string> {
    const searchParams = new URLSearchParams(params);
    const url = `${this.baseUrl}/api/oauth/authorize?${searchParams.toString()}`;

    const headers: Record<string, string> = {};

    // Add Clerk JWT template token as Bearer token for authentication
    if (this.integrationJwt) {
      headers['Authorization'] = `Bearer ${this.integrationJwt}`;
    }

    const response = await this.fetch(url, {
      method: 'GET',
      headers,
      redirect: 'manual', // Don't follow redirects
    });

    // If validation passes, it will redirect (302) or return error JSON (400/500)
    if (response.status === 302) {
      // Validation passed, return the redirect location
      return response.headers.get('location') || url;
    } else if (!response.ok) {
      // Validation failed, throw with error details
      const errorText = await response.text();
      throw new Error(
        `OAuth authorization failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    // For 200 responses (shouldn't happen in this flow)
    return url;
  }

  async exchangeCodeForToken(params: {
    code: string;
    client_id: string;
    redirect_uri: string;
    code_verifier: string;
  }): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope: string;
  }> {
    return this.request('/api/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        ...params,
      }),
    });
  }

  async refreshToken(params: {
    refresh_token: string;
    client_id: string;
  }): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
  }> {
    return this.request('/api/oauth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        ...params,
      }),
    });
  }

  // JWT token validation
  async validateJwtToken(jwtToken: string): Promise<{
    valid: boolean;
    claims?: any;
    error?: string;
    userId?: string;
    appId?: string;
    scope?: string;
  }> {
    const url = `${this.baseUrl}/api/validate-jwt-token`;
    console.log('🔧 Making JWT validation request to:', url);

    // Only send X-Echo-Token header - this endpoint should be public
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Echo-Token': jwtToken, // Our Echo token to validate
    };

    console.log('🔧 Headers being sent:', {
      'Content-Type': headers['Content-Type'],
      'X-Echo-Token': jwtToken.substring(0, 50) + '...',
    });

    const response = await this.fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({}), // Empty body to prevent JSON parsing errors
    });

    // For JWT validation, 400/401 with JSON body is a valid response (invalid token)
    if (response.status === 400 || response.status === 401 || response.ok) {
      return response.json();
    }

    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  // Balance endpoint (requires authentication)
  async getBalance(authToken: string): Promise<Balance> {
    const echoClient = new EchoClient({
      apiKey: authToken,
      baseUrl: this.baseUrl,
    });
    return await echoClient.getBalance();
  }

  // Payment endpoint
  async createPaymentLink(
    authToken: string,
    params: {
      amount: number;
      description?: string;
    }
  ): Promise<{
    payment_url: string;
    payment_id: string;
  }> {
    const echoClient = new EchoClient({ apiKey: authToken });
    const response = await echoClient.createPaymentLink({
      amount: params.amount,
      description: params.description ?? '',
    });

    return {
      payment_url: response.paymentLink.url,
      payment_id: response.paymentLink.id,
    };
  }
}

// Export a default instance with test configuration
export const echoControlApi = new EchoControlApiClient();

// Re-export test IDs from centralized config
export { TEST_CLIENT_IDS, TEST_USER_IDS } from '../config/index.js';
