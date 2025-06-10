import { Balance, ApiKeyValidationResult } from './types';
import { createHmac } from 'crypto';

/**
 * Secret key for deterministic API key hashing (should match echo-control)
 */
const API_KEY_SECRET =
  process.env.API_KEY_SECRET || 'change-this-in-production-very-secret-key';

/**
 * Hash an API key deterministically for O(1) database lookup
 */
function hashApiKey(apiKey: string): string {
  return createHmac('sha256', API_KEY_SECRET).update(apiKey).digest('hex');
}

// Generic database client interface to avoid direct Prisma dependency
export interface DatabaseClient {
  apiKey: {
    findUnique: (params: {
      where: { keyHash: string };
      include: { user: boolean; echoApp: boolean };
    }) => Promise<{
      id: string;
      keyHash: string;
      name: string | null;
      isActive: boolean;
      isArchived: boolean;
      lastUsed: Date | null;
      metadata: any;
      createdAt: Date;
      updatedAt: Date;
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
    update: (params: {
      where: { id: string };
      data: {
        totalPaid: {
          increment: number;
        };
      };
    }) => Promise<{ id: string }>;
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
        apiKeyId: string;
      };
    }) => Promise<{ id: string }>;
  };
  user: {
    findUnique: (params: {
      where: { id: string };
      select: {
        totalPaid: boolean;
        totalSpent: boolean;
      };
    }) => Promise<{
      totalPaid: string;
      totalSpent: string;
    } | null>;
    update: (params: {
      where: { id: string };
      data: {
        totalSpent: {
          increment: number;
        };
      };
    }) => Promise<{ id: string }>;
  };
  $transaction: <T>(fn: (tx: DatabaseClient) => Promise<T>) => Promise<T>;
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

      // Hash the provided API key for direct O(1) lookup
      const keyHash = hashApiKey(cleanApiKey);

      // Direct lookup by keyHash - O(1) operation!
      const apiKeyRecord = await this.db.apiKey.findUnique({
        where: {
          keyHash,
        },
        include: {
          user: true,
          echoApp: true,
        },
      });

      // Verify the API key is valid and all related entities are active
      if (
        !apiKeyRecord ||
        !apiKeyRecord.isActive ||
        apiKeyRecord.isArchived ||
        apiKeyRecord.user.isArchived ||
        apiKeyRecord.echoApp.isArchived ||
        !apiKeyRecord.echoApp.isActive
      ) {
        return null;
      }

      return {
        userId: apiKeyRecord.userId,
        echoAppId: apiKeyRecord.echoAppId,
        apiKeyId: apiKeyRecord.id,
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
        apiKey: {
          id: apiKeyRecord.id,
          key: cleanApiKey, // Return the plaintext key for compatibility
          ...(apiKeyRecord.name && { name: apiKeyRecord.name }),
          isActive: apiKeyRecord.isActive,
          ...(apiKeyRecord.lastUsed && {
            lastUsed: apiKeyRecord.lastUsed.toISOString(),
          }),
          ...(apiKeyRecord.metadata && { metadata: apiKeyRecord.metadata }),
          createdAt: apiKeyRecord.createdAt.toISOString(),
          updatedAt: apiKeyRecord.updatedAt.toISOString(),
          userId: apiKeyRecord.userId,
          echoAppId: apiKeyRecord.echoAppId,
        },
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Calculate total balance for a user across all apps
   * Uses User.totalPaid and User.totalSpent for consistent balance calculation
   */
  async getBalance(userId: string): Promise<Balance> {
    try {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: {
          totalPaid: true,
          totalSpent: true,
        },
      });

      if (!user) {
        console.error('User not found:', userId);
        return {
          balance: 0,
          totalCredits: 0,
          totalSpent: 0,
        };
      }

      const totalCredits = Number(user.totalPaid);
      const totalSpent = Number(user.totalSpent);
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
   * Create an LLM transaction record and atomically update user's totalSpent
   * Centralized logic for transaction creation with atomic balance updates
   */
  async createLlmTransaction(
    userId: string,
    echoAppId: string,
    apiKeyId: string,
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

      // Use a database transaction to atomically create the LLM transaction and update user balance
      const result = await this.db.$transaction(async tx => {
        // Create the LLM transaction
        const dbTransaction = await tx.llmTransaction.create({
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
            apiKeyId: apiKeyId,
          },
        });

        // Atomically update user's totalSpent
        await tx.user.update({
          where: { id: userId },
          data: {
            totalSpent: {
              increment: transaction.cost,
            },
          },
        });

        return dbTransaction;
      });

      console.log(
        `Created transaction for model ${transaction.model}: $${transaction.cost}, updated user totalSpent`,
        result.id
      );
      return result.id;
    } catch (error) {
      console.error('Error creating transaction and updating balance:', error);
      return null;
    }
  }
}
