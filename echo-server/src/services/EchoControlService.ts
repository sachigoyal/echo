import type {
  ApiKeyValidationResult,
  EchoApp,
  User,
  CreateLlmTransactionRequest,
} from '@zdql/echo-typescript-sdk/src/types';
import { EchoDbService } from './DbService';
import { existsSync } from 'fs';
import { join } from 'path';

import { PrismaClient } from '../generated/prisma';

export class EchoControlService {
  private readonly db: PrismaClient;
  private readonly dbService: EchoDbService;
  private readonly apiKey: string;
  private authResult: ApiKeyValidationResult | null = null;
  private appMarkup: number | null = null;
  private markUpId: string | null = null;
  private githubLinkId: string | null = null;

  constructor(apiKey: string) {
    // Check if the generated Prisma client exists
    const generatedPrismaPath = join(__dirname, '..', 'generated', 'prisma');
    if (!existsSync(generatedPrismaPath)) {
      throw new Error(
        `Generated Prisma client not found at ${generatedPrismaPath}. ` +
          'Please run "npm run copy-prisma" to copy the generated client from echo-control.'
      );
    }

    this.apiKey = apiKey;
    this.db = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL ?? 'postgresql://localhost:5469/echo',
        },
      },
    });
    this.dbService = new EchoDbService(this.db);
  }

  /**
   * Verify API key against the database and cache the authentication result
   * Uses centralized logic from EchoDbService
   */
  async verifyApiKey(): Promise<ApiKeyValidationResult | null> {
    try {
      this.authResult = await this.dbService.validateApiKey(this.apiKey);
    } catch (error) {
      console.error('Error verifying API key:', error);
      return null;
    }
    const markupData = await this.getAppMarkup();
    this.appMarkup = markupData.amount;
    this.markUpId = markupData.id;

    const githubLinkData = await this.getAppGithubLink();
    this.githubLinkId = githubLinkData.id;

    return this.authResult;
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
    return this.authResult?.userId ?? null;
  }

  /**
   * Get the echo app ID from cached authentication result
   */
  getEchoAppId(): string | null {
    return this.authResult?.echoAppId ?? null;
  }

  /**
   * Get the user from cached authentication result
   */
  getUser(): User | null {
    return this.authResult?.user ?? null;
  }

  /**
   * Get the echo app from cached authentication result
   */
  getEchoApp(): EchoApp | null {
    return this.authResult?.echoApp ?? null;
  }

  /**
   * Get the cached GitHub link ID
   */
  getGithubLinkId(): string | null {
    return this.githubLinkId;
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

      const { userId } = this.authResult;
      const balance = await this.dbService.getBalance(userId);

      console.log('fetched balance', balance);
      return balance.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async getAppMarkup(): Promise<{ amount: number; id: string | null }> {
    if (!this.authResult) {
      console.error('No authentication result available');
      return { amount: 1.0, id: null };
    }

    const appWithMarkup = await this.db.echoApp.findUnique({
      where: {
        id: this.getEchoAppId() ?? '',
      },
      select: {
        markUp: {
          select: {
            id: true,
            amount: true,
            isActive: true,
            isArchived: true,
          },
        },
      },
    });
    console.log(
      'App Markup being Used: ',
      appWithMarkup?.markUp?.id,
      appWithMarkup?.markUp?.amount
    );

    if (!appWithMarkup) {
      throw new Error('EchoApp not found');
    }

    // If no markup record exists, return default
    if (!appWithMarkup.markUp) {
      return { amount: 1.0, id: null };
    }

    // Check if markup is active
    if (appWithMarkup.markUp.isArchived || !appWithMarkup.markUp.isActive) {
      return { amount: 1.0, id: null };
    }

    if (!appWithMarkup.markUp.amount) {
      return { amount: 1.0, id: null };
    }

    const markupAmount = appWithMarkup.markUp.amount.toNumber();
    if (markupAmount < 1.0) {
      throw new Error('App markup must be greater than or equal to 1.0');
    }

    return {
      amount: markupAmount,
      id: appWithMarkup.markUp.id,
    };
  }

  async getAppGithubLink(): Promise<{
    githubId: string | null;
    githubType: string | null;
    id: string | null;
  }> {
    if (!this.authResult) {
      console.error('No authentication result available');
      return { githubId: null, githubType: null, id: null };
    }

    const githubLink = await this.db.githubLink.findUnique({
      where: {
        echoAppId: this.getEchoAppId() ?? '',
      },
      select: {
        id: true,
        githubId: true,
        githubType: true,
        isActive: true,
        isArchived: true,
      },
    });

    console.log(
      'Github Link being Used: ',
      githubLink?.id,
      githubLink?.githubId,
      githubLink?.githubType
    );

    // Return null values if no link exists or if it's inactive/archived
    if (!githubLink || githubLink.isArchived || !githubLink.isActive) {
      return { githubId: null, githubType: null, id: null };
    }

    return {
      githubId: githubLink.githubId,
      githubType: githubLink.githubType,
      id: githubLink.id,
    };
  }

  /**
   * Create an LLM transaction record directly in the database
   * Uses centralized logic from EchoDbService
   */
  async createTransaction(
    transaction: CreateLlmTransactionRequest
  ): Promise<void> {
    try {
      if (!this.authResult) {
        console.error('No authentication result available');
        return;
      }

      if (!this.appMarkup) {
        console.error('User has not authenticated');
        return;
      }

      const cost = transaction.cost * this.appMarkup;
      transaction.cost = cost;

      const { userId, echoAppId, apiKeyId } = this.authResult;
      await this.dbService.createLlmTransaction(
        userId,
        echoAppId,
        transaction,
        apiKeyId,
        this.markUpId || undefined,
        this.githubLinkId || undefined
      );
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  }
}
