import { PrismaClient } from '../../../echo-control/src/generated/prisma';
import { User, EchoApp, CreateLlmTransactionRequest, EchoDbService, ApiKeyValidationResult, DatabaseClient } from '@echo/typescript-sdk';

export class EchoControlService {
  private db: PrismaClient;
  private dbService: EchoDbService;
  private apiKey: string;
  private authResult: ApiKeyValidationResult | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    this.dbService = new EchoDbService(this.db as unknown as DatabaseClient);
  }

  /**
   * Verify API key against the database and cache the authentication result
   * Uses centralized logic from EchoDbService
   */
  async verifyApiKey(): Promise<ApiKeyValidationResult | null> {
    try {
      this.authResult = await this.dbService.validateApiKey(this.apiKey);
      return this.authResult;
    } catch (error) {
      console.error('Error verifying API key:', error);
      return null;
    }
  }

  /**
   * Get the cached authentication result
   */
  getAuthResult(): ApiKeyValidationResult | null {
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
   * Get balance for the authenticated user directly from the database
   * Uses centralized logic from EchoDbService
   */
  async getBalance(): Promise<number> {
    try {
      if (!this.authResult) {
        console.error('No authentication result available');
        return 0;
      }

      const { userId, echoAppId } = this.authResult;
      const balance = await this.dbService.getBalance(userId, echoAppId);
      
      console.log("fetched balance", balance);
      return balance.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  /**
   * Create an LLM transaction record directly in the database
   * Uses centralized logic from EchoDbService
   */
  async createTransaction(transaction: CreateLlmTransactionRequest): Promise<void> {
    try {
      if (!this.authResult) {
        console.error('No authentication result available');
        return;
      }

      const { userId, echoAppId } = this.authResult;
      await this.dbService.createLlmTransaction(userId, echoAppId, transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  }
} 