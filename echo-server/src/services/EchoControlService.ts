import type {
  ApiKeyValidationResult,
  EchoApp,
  User,
  Transaction,
  TransactionRequest,
} from '../types';
import { EchoDbService } from './DbService';
import { existsSync } from 'fs';
import { join } from 'path';

import { PrismaClient, SpendPool } from '../generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import FreeTierService from './FreeTierService';
import { PaymentRequiredError, UnauthorizedError } from '../errors/http';
import { EarningsService } from './EarningsService';

export class EchoControlService {
  private readonly db: PrismaClient;
  private readonly dbService: EchoDbService;
  private readonly freeTierService: FreeTierService;
  private earningsService: EarningsService;
  private readonly apiKey: string;
  private authResult: ApiKeyValidationResult | null = null;
  private markUpAmount: Decimal | null = null;
  private markUpId: string | null = null;
  private referralAmount: Decimal | null = null;
  private referralId: string | null = null;
  private githubLinkId: string | null = null;
  private freeTierSpendPool: SpendPool | null = null;
  private githubId: string | null = null;
  private githubType: string | null = null;

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
    this.freeTierService = new FreeTierService(this.db);
    this.earningsService = new EarningsService(this.db);
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
    const markupData = await this.earningsService.getEarningsData(
      this.authResult,
      this.getEchoAppId() ?? ''
    );
    this.markUpAmount = markupData.markUpAmount;
    this.markUpId = markupData.markUpId;
    this.referralId = markupData.referralId;
    this.referralAmount = markupData.referralAmount;

    const githubLinkData = await this.getAppGithubLink();
    this.githubLinkId = githubLinkData.id;
    this.githubId = githubLinkData.githubId;
    this.githubType = githubLinkData.githubType;

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

      return balance.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
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
        isArchived: true,
      },
    });

    // Return null values if no link exists or if it's inactive/archived
    if (!githubLink || githubLink.isArchived) {
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
  async createTransaction(transaction: Transaction): Promise<void> {
    try {
      if (!this.authResult) {
        console.error('No authentication result available');
        return;
      }

      if (!this.markUpAmount) {
        console.error('User has not authenticated');
        return;
      }

      if (this.freeTierSpendPool) {
        await this.createFreeTierTransaction(transaction);
        return;
      } else {
        await this.createPaidTransaction(transaction);
        return;
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  }

  async getOrNoneFreeTierSpendPool(
    userId: string,
    appId: string
  ): Promise<SpendPool | null> {
    this.freeTierSpendPool =
      await this.freeTierService.getOrNoneFreeTierSpendPool(appId, userId);
    return this.freeTierSpendPool;
  }

  async computeTransactionCosts(transaction: Transaction): Promise<{
    rawTransactionCost: Decimal;
    totalTransactionCost: Decimal;
    totalAppProfit: Decimal;
    referralProfit: Decimal;
    markUpProfit: Decimal;
  }> {
    if (!this.markUpAmount) {
      console.error('User has not authenticated');
      throw new UnauthorizedError('User has not authenticated');
    }

    if (!this.referralAmount) {
      console.error('Referral amount not found');
      throw new UnauthorizedError('Referral amount not found');
    }

    const markUpDecimal = this.markUpAmount.minus(1);
    const referralDecimal = this.referralAmount.minus(1);

    if (markUpDecimal.lessThan(0.0)) {
      console.error('App markup must be greater than 1.0');
      throw new UnauthorizedError('App markup must be greater than 1.0');
    }

    if (referralDecimal.lessThan(0.0)) {
      console.error('Referral amount must be greater than 1.0');
      throw new UnauthorizedError('Referral amount must be greater than 1.0');
    }

    // Perform all calculations using Decimal arithmetic
    const totalAppProfitDecimal =
      transaction.rawTransactionCost.mul(markUpDecimal);
    const referralProfitDecimal = totalAppProfitDecimal.mul(referralDecimal);
    const markUpProfitDecimal = totalAppProfitDecimal.minus(
      referralProfitDecimal
    );
    const totalTransactionCostDecimal = transaction.rawTransactionCost.plus(
      totalAppProfitDecimal
    );

    // Return Decimal values directly
    return {
      rawTransactionCost: transaction.rawTransactionCost,
      totalTransactionCost: totalTransactionCostDecimal,
      totalAppProfit: totalAppProfitDecimal,
      referralProfit: referralProfitDecimal,
      markUpProfit: markUpProfitDecimal,
    };
  }
  async createFreeTierTransaction(transaction: Transaction): Promise<void> {
    if (!this.authResult) {
      console.error('No authentication result available');
      throw new UnauthorizedError('No authentication result available');
    }

    if (!this.freeTierSpendPool) {
      console.error('No free tier spend pool available');
      throw new PaymentRequiredError('No free tier spend pool available');
    }

    const { userId, echoAppId, apiKeyId } = this.authResult;
    if (!userId || !echoAppId) {
      console.error('Missing required user or app information');
      throw new UnauthorizedError('Missing required user or app information');
    }

    const {
      rawTransactionCost,
      totalTransactionCost,
      totalAppProfit,
      referralProfit,
      markUpProfit,
    } = await this.computeTransactionCosts(transaction);

    // Markup is checked, but not applied here because it is a free tier transaction
    const githubLinkId = this.githubLinkId ?? undefined;

    const transactionData: TransactionRequest = {
      totalCost: totalTransactionCost,
      appProfit: totalAppProfit,
      markUpProfit: markUpProfit,
      referralProfit: referralProfit,
      rawTransactionCost: rawTransactionCost,
      metadata: transaction.metadata,
      status: transaction.status,
      userId: userId,
      echoAppId: echoAppId,
      ...(apiKeyId && { apiKeyId }),
      ...(githubLinkId && { githubLinkId }),
      ...(this.markUpId && { markUpId: this.markUpId }),
      ...(this.freeTierSpendPool.id && {
        spendPoolId: this.freeTierSpendPool.id,
      }),
    };

    await this.freeTierService.createFreeTierTransaction(
      transactionData,
      this.freeTierSpendPool.id
    );
  }

  async createPaidTransaction(transaction: Transaction): Promise<void> {
    if (!this.authResult) {
      console.error('No authentication result available');
      throw new UnauthorizedError('No authentication result available');
    }

    const {
      rawTransactionCost,
      totalTransactionCost,
      totalAppProfit,
      referralProfit,
      markUpProfit,
    } = await this.computeTransactionCosts(transaction);

    const { userId, echoAppId, apiKeyId } = this.authResult;

    const transactionData: TransactionRequest = {
      totalCost: totalTransactionCost,
      appProfit: totalAppProfit,
      markUpProfit: markUpProfit,
      referralProfit: referralProfit,
      rawTransactionCost: rawTransactionCost,
      metadata: transaction.metadata,
      status: transaction.status,
      userId: userId,
      echoAppId: echoAppId,
      ...(apiKeyId && { apiKeyId }),
      ...(this.githubLinkId && { githubLinkId: this.githubLinkId }),
      ...(this.markUpId && { markUpId: this.markUpId }),
    };

    await this.dbService.createPaidTransaction(transactionData);
  }
}
