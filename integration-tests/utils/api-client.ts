import { TEST_DATA } from '../scripts/seed-integration-db';

export interface EchoControlApiClient {
  baseUrl: string;
  fetch: typeof fetch;
}

export class EchoControlApiClient {
  constructor(
    baseUrl: string = process.env.ECHO_CONTROL_URL || 'http://localhost:3001'
  ) {
    this.baseUrl = baseUrl;
    this.fetch = fetch;
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
  }): Promise<string> {
    const searchParams = new URLSearchParams(params);
    return `${this.baseUrl}/api/oauth/authorize?${searchParams.toString()}`;
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

  // API Key validation
  async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    userId?: string;
    echoAppId?: string;
  }> {
    return this.request('/api/validate-api-key', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  // JWT token validation
  async validateJwtToken(jwtToken: string): Promise<{
    valid: boolean;
    claims?: any;
  }> {
    return this.request('/api/validate-jwt-token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
  }

  // Balance endpoint (requires authentication)
  async getBalance(authToken: string): Promise<{
    credits: number;
  }> {
    return this.request('/api/balance', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  }

  // Echo Apps endpoint
  async getEchoApps(authToken: string): Promise<any[]> {
    return this.request('/api/echo-apps', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  }

  // Payment endpoint
  async createPaymentLink(
    authToken: string,
    params: {
      amount: number;
      currency?: string;
      description?: string;
    }
  ): Promise<{
    payment_url: string;
    payment_id: string;
  }> {
    return this.request('/api/stripe/payment-link', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(params),
    });
  }
}

// Export a default instance with test configuration
export const echoControlApi = new EchoControlApiClient();

// Export test client IDs for easy access
export const TEST_CLIENT_IDS = {
  primary: TEST_DATA.echoApps.testApp.id,
  secondary: TEST_DATA.echoApps.secondApp.id,
};

export const TEST_USER_IDS = {
  primary: TEST_DATA.users.testUser.id,
  secondary: TEST_DATA.users.secondUser.id,
};
