import { Balance, ApiKeyValidationResult } from './types';

// Generic database client interface to avoid direct Prisma dependency
export interface DatabaseClient {
  apiKey: {
    findUnique: (params: {
      where: { key: string; isActive: boolean };
      include: { user: boolean; echoApp: boolean };
    }) => Promise<{
      userId: string;
      echoAppId: string;
      user: {
        id: string;
        email: string;
        name: string | null;
        clerkId: string;
        createdAt: Date;
        updatedAt: Date;
      };
      echoApp: {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
      };
    } | null>;
  };
  payment: {
    aggregate: (params: {
      where: { userId: string; status: string; echoAppId?: string };
      _sum: { amount: boolean };
    }) => Promise<{ _sum: { amount: number | null } }>;
  };
  llmTransaction: {
    aggregate: (params: {
      where: { userId: string; echoAppId?: string };
      _sum: { cost: boolean };
    }) => Promise<{ _sum: { cost: any | null } }>;
    create: (params: {
      data: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        cost: number;
        prompt: string | null;
        response: string | null;
        status: string;
        errorMessage: string | null;
        userId: string;
        echoAppId: string;
      };
    }) => Promise<{ id: string }>;
  };
}

export class EchoDbService {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  /**
   * Validate an API key and return user/app information
   * Centralized logic previously duplicated in echo-control and echo-server
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult | null> {
    try {
      // Remove Bearer prefix if present
      const cleanApiKey = apiKey.replace('Bearer ', '');

      const apiKeyRecord = await this.db.apiKey.findUnique({
        where: { 
          key: cleanApiKey,
          isActive: true 
        },
        include: {
          user: true,
          echoApp: true
        }
      });

      if (!apiKeyRecord || !apiKeyRecord.echoApp || !apiKeyRecord.echoApp.isActive) {
        return null;
      }

      return {
        userId: apiKeyRecord.userId,
        echoAppId: apiKeyRecord.echoAppId,
        user: {
          id: apiKeyRecord.user.id,
          email: apiKeyRecord.user.email,
          name: apiKeyRecord.user.name || undefined,
          clerkId: apiKeyRecord.user.clerkId,
          createdAt: apiKeyRecord.user.createdAt.toISOString(),
          updatedAt: apiKeyRecord.user.updatedAt.toISOString()
        },
        echoApp: {
          id: apiKeyRecord.echoApp.id,
          name: apiKeyRecord.echoApp.name,
          description: apiKeyRecord.echoApp.description || undefined,
          isActive: apiKeyRecord.echoApp.isActive,
          createdAt: apiKeyRecord.echoApp.createdAt.toISOString(),
          updatedAt: apiKeyRecord.echoApp.updatedAt.toISOString(),
          userId: apiKeyRecord.echoApp.userId
        }
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Calculate balance for a user and optional echo app
   * Centralized logic previously duplicated in echo-control and echo-server
   */
  async getBalance(userId: string, echoAppId?: string): Promise<Balance> {
    try {
      // Calculate balance from payments and transactions
      const paymentsFilter: { userId: string; status: string; echoAppId?: string } = {
        userId: userId,
        status: 'completed'
      };
      
      const transactionsFilter: { userId: string; echoAppId?: string } = {
        userId: userId
      };

      // If echoAppId is provided, filter by app
      if (echoAppId) {
        paymentsFilter.echoAppId = echoAppId;
        transactionsFilter.echoAppId = echoAppId;
      }

      const payments = await this.db.payment.aggregate({
        where: paymentsFilter,
        _sum: {
          amount: true,
        },
      });

      const transactions = await this.db.llmTransaction.aggregate({
        where: transactionsFilter,
        _sum: {
          cost: true,
        },
      });

      const totalCredits = (payments._sum.amount || 0) / 100; // Convert from cents
      const totalSpent = Number(transactions._sum.cost || 0);
      const balance = totalCredits - totalSpent;

      return {
        balance,
        totalCredits,
        totalSpent,
        echoAppId: echoAppId,
        echoAppName: undefined // This would need to be passed in or fetched separately
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return {
        balance: 0,
        totalCredits: 0,
        totalSpent: 0,
        echoAppId: echoAppId,
        echoAppName: undefined
      };
    }
  }

  /**
   * Create an LLM transaction record
   * Centralized logic for transaction creation
   */
  async createLlmTransaction(
    userId: string,
    echoAppId: string,
    transaction: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      cost: number;
      prompt?: string;
      response?: string;
      status?: string;
      errorMessage?: string;
    }
  ): Promise<string | null> {
    try {
      // Validate required fields
      if (!transaction.model || typeof transaction.inputTokens !== 'number' || 
          typeof transaction.outputTokens !== 'number' || typeof transaction.totalTokens !== 'number' || 
          typeof transaction.cost !== 'number') {
        throw new Error('Missing required fields: model, inputTokens, outputTokens, totalTokens, cost');
      }

      // Create the LLM transaction
      const dbTransaction = await this.db.llmTransaction.create({
        data: {
          model: transaction.model,
          inputTokens: transaction.inputTokens,
          outputTokens: transaction.outputTokens,
          totalTokens: transaction.totalTokens,
          cost: transaction.cost,
          prompt: transaction.prompt || null,
          response: transaction.response || null,
          status: transaction.status || 'success',
          errorMessage: transaction.errorMessage || null,
          userId: userId,
          echoAppId: echoAppId,
        },
      });

      console.log(`Created transaction for model ${transaction.model}: $${transaction.cost}`, dbTransaction.id);
      return dbTransaction.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }
} 