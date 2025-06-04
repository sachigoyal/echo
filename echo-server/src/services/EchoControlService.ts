import { EchoClient, User, EchoApp, CreateLlmTransactionRequest, Balance } from '@echo/typescript-sdk';

// Authentication result interface - this is specific to our validation endpoint
// and doesn't exist in the SDK, so we keep it here
export interface AuthenticationResult {
  userId: string;
  echoAppId: string;
  user: User;
  echoApp: EchoApp;
}

export class EchoControlService {
  private echoControlUrl: string;
  private client: EchoClient;
  private apiKey: string;
  private authResult: AuthenticationResult | null = null;

  constructor(apiKey: string) {
    this.echoControlUrl = process.env.ECHO_CONTROL_URL || 'http://localhost:3000';
    this.apiKey = apiKey;
    this.client = new EchoClient({
      apiKey: apiKey,
      baseUrl: this.echoControlUrl
    });
  }

  /**
   * Verify API key against echo-control and cache the authentication result
   */
  async verifyApiKey(): Promise<AuthenticationResult | null> {
    try {
      const response = await fetch(`${this.echoControlUrl}/api/validate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey
        })
      });

      if (!response.ok) {
        console.error('API key validation failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.valid && data.userId) {
        this.authResult = {
          userId: data.userId,
          echoAppId: data.echoAppId,
          user: data.user,
          echoApp: data.echoApp
        };
        return this.authResult;
      }

      return null;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return null;
    }
  }

  /**
   * Get the cached authentication result
   */
  getAuthResult(): AuthenticationResult | null {
    return this.authResult;
  }

  /**
   * Get the user ID from cached authentication result
   */
  getUserId(): string | null {
    return this.authResult?.userId || null;
  }

  /**
   * Get the echo app ID from cached authentication result
   */
  getEchoAppId(): string | null {
    return this.authResult?.echoAppId || null;
  }

  /**
   * Get the user from cached authentication result
   */
  getUser(): User | null {
    return this.authResult?.user || null;
  }

  /**
   * Get the echo app from cached authentication result
   */
  getEchoApp(): EchoApp | null {
    return this.authResult?.echoApp || null;
  }

  /**
   * Get balance for the authenticated user using the SDK
   */
  async getBalance(): Promise<number> {
    try {
      const balance: Balance = await this.client.getBalance();
      console.log("fetched balance", balance);
      return balance.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  /**
   * Create an LLM transaction record in echo-control using the SDK
   */
  async createTransaction(transaction: CreateLlmTransactionRequest): Promise<void> {
    try { 
      const result = await this.client.createTransaction(transaction);
      console.log(`Created transaction for model ${transaction.model}: $${transaction.cost}`, result.id);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  }
} 