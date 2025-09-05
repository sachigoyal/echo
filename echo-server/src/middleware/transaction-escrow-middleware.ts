import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma';
import { MaxInFlightRequestsError, PaymentRequiredError } from '../errors/http';
import logger from '../logger';

const MAX_IN_FLIGHT_REQUESTS = 10;
const ESTIMATED_COST_PER_TRANSACTION = 0.01;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Extended Request interface to store escrow context
export interface EscrowRequest extends Request {
  escrowContext?: {
    userId: string;
    echoAppId: string;
    effectiveBalance: number;
    requestId: string;
    startTime: number;
  };
  authContext?: {
    processedHeaders: Record<string, string>;
    echoControlService: any; // Import proper type if needed
  };
}

export class TransactionEscrowMiddleware {
  private readonly db: PrismaClient;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(db: PrismaClient) {
    this.db = db;
    this.startCleanupProcess();
  }
  /**
   * Handle in-flight request increment and setup cleanup
   * Can be used directly or via middleware
   */
  async handleInFlightRequestIncrement(
    req: EscrowRequest,
    res: Response
  ): Promise<void> {
    if (!req.escrowContext) {
      throw new Error('Escrow context not found on request');
    }

    const { userId, echoAppId, effectiveBalance, requestId } =
      req.escrowContext;

    // Increment in-flight requests or reject if limits exceeded
    await this.incrementInFlightRequestsOrReject(
      userId,
      echoAppId,
      effectiveBalance
    );

    // Set up cleanup on response finish
    this.setupResponseCleanup(res, userId, echoAppId, requestId);
  }

  /**
   * Sets up the escrow context on the request object
   */
  setupEscrowContext(
    req: EscrowRequest,
    userId: string,
    echoAppId: string,
    effectiveBalance: number
  ) {
    req.escrowContext = {
      userId,
      echoAppId,
      effectiveBalance,
      requestId: this.generateRequestId(),
      startTime: Date.now(),
    };
  }

  /**
   * Increment in-flight requests with proper validation
   */
  private async incrementInFlightRequestsOrReject(
    userId: string,
    echoAppId: string,
    effectiveBalance: number
  ): Promise<void> {
    try {
      await this.db.$transaction(async tx => {
        // Get current in-flight request count
        const currentInFlightRequest = await tx.inFlightRequest.findUnique({
          where: {
            userId_echoAppId: {
              userId,
              echoAppId,
            },
          },
        });

        // Check rate limits
        if (
          currentInFlightRequest &&
          currentInFlightRequest.numberInFlight >= MAX_IN_FLIGHT_REQUESTS
        ) {
          throw new MaxInFlightRequestsError(
            'Maximum concurrent requests exceeded'
          );
        }

        // Check balance constraints
        const estimatedCost =
          (currentInFlightRequest?.numberInFlight || 0) *
          ESTIMATED_COST_PER_TRANSACTION;
        if (estimatedCost >= effectiveBalance) {
          throw new PaymentRequiredError(
            'Insufficient balance for concurrent requests'
          );
        }

        // Atomically increment the counter
        await tx.inFlightRequest.upsert({
          where: {
            userId_echoAppId: {
              userId,
              echoAppId,
            },
          },
          update: {
            numberInFlight: { increment: 1 },
            updatedAt: new Date(),
          },
          create: {
            userId,
            echoAppId,
            numberInFlight: 1,
          },
        });
      });

      logger.info(
        `Incremented in-flight requests for user ${userId} and app ${echoAppId}`
      );
    } catch (error) {
      logger.error(`Failed to increment in-flight requests: ${error}`);
      throw error;
    }
  }

  /**
   * Set up automatic cleanup when response finishes
   */
  private setupResponseCleanup(
    res: Response,
    userId: string,
    echoAppId: string,
    requestId: string
  ) {
    let cleanupExecuted = false;

    const executeCleanup = async () => {
      if (cleanupExecuted) return;
      cleanupExecuted = true;

      try {
        await this.decrementInFlightRequests(userId, echoAppId);
        logger.debug(
          `Cleaned up in-flight request ${requestId} for user ${userId}`
        );
      } catch (error) {
        logger.error(
          `Failed to cleanup in-flight request ${requestId}: ${error}`
        );
      }
    };

    // Cleanup on response finish (normal case)
    res.on('finish', executeCleanup);

    // Cleanup on response close (client disconnect)
    res.on('close', executeCleanup);

    // Cleanup on error (if response errors out)
    res.on('error', executeCleanup);
  }

  /**
   * Decrement in-flight requests safely
   */
  private async decrementInFlightRequests(
    userId: string,
    echoAppId: string
  ): Promise<void> {
    try {
      await this.db.$transaction(async tx => {
        const inFlightRequest = await tx.inFlightRequest.findUnique({
          where: {
            userId_echoAppId: {
              userId,
              echoAppId,
            },
          },
        });

        if (!inFlightRequest || inFlightRequest.numberInFlight <= 0) {
          logger.warn(
            `Attempted to decrement in-flight requests for ${userId}/${echoAppId} but count is already 0`
          );
          return;
        }

        await tx.inFlightRequest.update({
          where: {
            userId_echoAppId: {
              userId,
              echoAppId,
            },
          },
          data: {
            numberInFlight: { decrement: 1 },
            updatedAt: new Date(),
          },
        });
      });
    } catch (error) {
      logger.error(
        `Failed to decrement in-flight requests for ${userId}/${echoAppId}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Cleanup orphaned in-flight requests (requests that started but never finished)
   */
  private async cleanupOrphanedRequests(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - REQUEST_TIMEOUT_MS);

      const orphanedRequests = await this.db.inFlightRequest.findMany({
        where: {
          numberInFlight: { gt: 0 },
          updatedAt: { lt: cutoffTime },
        },
      });

      if (orphanedRequests.length > 0) {
        logger.info(
          `Found ${orphanedRequests.length} orphaned in-flight requests, cleaning up...`
        );

        for (const request of orphanedRequests) {
          await this.db.inFlightRequest.update({
            where: { id: request.id },
            data: {
              numberInFlight: 0,
              updatedAt: new Date(),
            },
          });
        }

        logger.info(`Cleaned up ${orphanedRequests.length} orphaned requests`);
      }
    } catch (error) {
      logger.error(`Failed to cleanup orphaned requests: ${error}`);
    }
  }

  /**
   * Start the background cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupOrphanedRequests();
    }, CLEANUP_INTERVAL_MS);

    logger.info('Started transaction escrow cleanup process');
  }

  /**
   * Stop the cleanup process (for graceful shutdown)
   */
  stopCleanupProcess(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Stopped transaction escrow cleanup process');
    }
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
