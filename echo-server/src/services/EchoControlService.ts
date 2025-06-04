import { EchoClient } from '@echo/typescript-sdk';

// Types for authentication result
export interface AuthenticationResult {
  userId: string;
  echoAppId: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  echoApp: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
  };
}

// Interface for transaction creation
export interface CreateTransactionRequest {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  prompt?: string;
  response?: string;
  status: string;
  errorMessage?: string;
  userId: string;
  echoAppId: string;
}

export class EchoControlService {
  private echoControlUrl: string;

  constructor() {
    this.echoControlUrl = process.env.ECHO_CONTROL_URL || 'http://localhost:3000';
  }

  /**
   * Verify API key against echo-control and return authentication result
   */
  async verifyApiKey(apiKey: string): Promise<AuthenticationResult | null> {
    try {
      const response = await fetch(`${this.echoControlUrl}/api/validate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        console.error('API key validation failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.valid && data.userId) {
        return {
          userId: data.userId,
          echoAppId: data.echoAppId,
          user: data.user,
          echoApp: data.echoApp
        };
      }

      return null;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return null;
    }
  }

  /**
   * Get balance for a specific user and echo app using authenticated API key
   */
  async getBalance(apiKey: string): Promise<number> {
    try {
      // Create an authenticated client with the API key
      const client = new EchoClient({
        apiKey: apiKey,
        baseUrl: this.echoControlUrl
      });

      const balance = await client.getBalance();
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
  async createTransaction(apiKey: string, transaction: CreateTransactionRequest): Promise<void> {
    try { 
      // Create an authenticated client with the API key
      const client = new EchoClient({
        apiKey: apiKey,
        baseUrl: this.echoControlUrl
      });

      const result = await client.createTransaction({
        model: transaction.model,
        inputTokens: transaction.inputTokens,
        outputTokens: transaction.outputTokens,
        totalTokens: transaction.totalTokens,
        cost: transaction.cost,
        prompt: transaction.prompt,
        response: transaction.response,
        status: transaction.status,
        errorMessage: transaction.errorMessage
      });

      console.log(`Created transaction for model ${transaction.model}: $${transaction.cost}`, result.id);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  }

  /**
   * Add credits to account (for testing or manual adjustments)
   */
  async incrementBalance(apiKey: string, amount: number, description?: string): Promise<void> {
    try {
      const response = await fetch(`${this.echoControlUrl}/api/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.replace("Bearer ", "")}`
        },
        body: JSON.stringify({
          amount: amount,
          operation: 'increment',
          description: description || 'Credit adjustment'
        })
      });

      if (!response.ok) {
        console.error('Failed to increment balance:', response.status, response.statusText);
        return;
      }

      console.log(`Added ${amount} credits to account`);
    } catch (error) {
      console.error('Error incrementing balance:', error);
    }
  }
}

// Export singleton instance
export const echoControlService = new EchoControlService(); 