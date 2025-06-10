import { Balance, ApiKeyValidationResult } from './types';

// Generic database client interface to avoid direct Prisma dependency
export interface DatabaseClient {
  apiKey: {
    findUnique: (params: {
      where: { key: string; isActive: boolean; isArchived: boolean };
      include: { user: boolean; echoApp: boolean };
    }) => Promise<{
      userId: string;
      echoAppId: string;
      user: {
        id: string;
        email: string;
        name: string | null;
        clerkId: string;
        isArchived: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
      echoApp: {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        isArchived: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
      };
    } | null>;
  };
  payment: {
    aggregate: (params: {
      where: {
        userId: string;
        status: string;
        isArchived: boolean;
      };
      _sum: { amount: boolean };
    }) => Promise<{ _sum: { amount: number | null } }>;
  };
  llmTransaction: {
    aggregate: (params: {
      where: { userId: string; isArchived: boolean };
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
          isActive: true,
          isArchived: false, // Only validate non-archived API keys
        },
        include: {
          user: true,
          echoApp: true,
        },
      });

      if (
        !apiKeyRecord ||
        !apiKeyRecord.echoApp ||
        !apiKeyRecord.echoApp.isActive ||
        apiKeyRecord.user.isArchived ||
        apiKeyRecord.echoApp.isArchived
      ) {
        return null;
      }

      return {
        userId: apiKeyRecord.userId,
        echoAppId: apiKeyRecord.echoAppId,
        user: {
          id: apiKeyRecord.user.id,
          email: apiKeyRecord.user.email,
          ...(apiKeyRecord.user.name && { name: apiKeyRecord.user.name }),
          clerkId: apiKeyRecord.user.clerkId,
          createdAt: apiKeyRecord.user.createdAt.toISOString(),
          updatedAt: apiKeyRecord.user.updatedAt.toISOString(),
        },
        echoApp: {
          id: apiKeyRecord.echoApp.id,
          name: apiKeyRecord.echoApp.name,
          ...(apiKeyRecord.echoApp.description && {
            description: apiKeyRecord.echoApp.description,
          }),
          isActive: apiKeyRecord.echoApp.isActive,
          createdAt: apiKeyRecord.echoApp.createdAt.toISOString(),
          updatedAt: apiKeyRecord.echoApp.updatedAt.toISOString(),
          userId: apiKeyRecord.echoApp.userId,
        },
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Calculate total balance for a user across all apps
   * Centralized logic previously duplicated in echo-control and echo-server
   */
  async getBalance(userId: string): Promise<Balance> {
    try {
      // Calculate balance from payments and transactions across all apps
      const paymentsFilter = {
        userId: userId,
        status: 'completed',
        isArchived: false, // Only include non-archived payments
      };

      const transactionsFilter = {
        userId: userId,
        isArchived: false, // Only include non-archived transactions
      };

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
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return {
        balance: 0,
        totalCredits: 0,
        totalSpent: 0,
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
      if (
        !transaction.model ||
        typeof transaction.inputTokens !== 'number' ||
        typeof transaction.outputTokens !== 'number' ||
        typeof transaction.totalTokens !== 'number' ||
        typeof transaction.cost !== 'number'
      ) {
        throw new Error(
          'Missing required fields: model, inputTokens, outputTokens, totalTokens, cost'
        );
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

      console.log(
        `Created transaction for model ${transaction.model}: $${transaction.cost}`,
        dbTransaction.id
      );
      return dbTransaction.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }
}
