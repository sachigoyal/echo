import { Prisma } from '@/generated/prisma';
import {
  processPaymentUpdate,
  PaymentProcessingData,
} from '@/lib/payment-processing';
import { isGlobalAdmin } from '../index';
import { db } from '@/lib/db';

export interface MintCreditsOptions {
  /** Description for the payment record */
  description?: string;
  /** Whether this is a free tier credit mint */
  isFreeTier?: boolean;
  /** Echo app ID for free tier credits */
  echoAppId?: string;
  /** Additional metadata for the payment */
  metadata?: Record<string, string>;
  /** Pool name for free tier credits */
  poolName?: string;
  /** Default spend limit for free tier pool */
  defaultSpendLimit?: number;
}

/**
 * Mint credits to a user by creating a payment record and updating their balance
 * Similar to handlePaymentSuccess but for issuing credits directly
 * @param tx - The database transaction client
 * @param userId - The user ID to mint credits to
 * @param amountInDollars - The amount in dollars to mint
 * @param options - Configuration options for the credit mint
 */
export async function mintCreditsToUser(
  userId: string,
  amountInDollars: number,
  options: MintCreditsOptions = {},
  tx?: Prisma.TransactionClient
): Promise<void> {
  tx = tx || db;

  const isAdmin = await isGlobalAdmin();

  if (!isAdmin) {
    throw new Error('Admin access required');
  }

  const {
    description = options.isFreeTier
      ? 'ADMIN FREE TIER ISSUED PAYMENT'
      : 'ADMIN ISSUED PAYMENT',
    isFreeTier = false,
    echoAppId,
    metadata = {},
    poolName,
    defaultSpendLimit,
  } = options;

  if (amountInDollars <= 0) {
    throw new Error('Amount must be positive');
  }

  if (isFreeTier && !echoAppId) {
    throw new Error('echoAppId is required for free tier credit minting');
  }

  // Convert dollars to cents for storage
  const amountInCents = Math.round(amountInDollars * 100);

  // Generate a unique payment ID for tracking
  const paymentId = `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Prepare metadata based on payment type
  const paymentMetadata = {
    ...metadata,
    type: isFreeTier ? 'free-tier-credits' : 'admin-issued',
    mintedAt: new Date().toISOString(),
    ...(poolName && { poolName }),
    ...(defaultSpendLimit && {
      defaultSpendLimit: defaultSpendLimit.toString(),
    }),
  };

  // Create payment record
  const paymentRecord = await tx.payment.create({
    data: {
      paymentId: paymentId,
      amount: amountInDollars,
      currency: 'usd',
      status: 'completed',
      description,
      userId,
    },
  });

  // Process the payment update using the existing payment processing logic
  const paymentData: PaymentProcessingData = {
    userId,
    amountInCents,
    paymentRecord,
    metadata: paymentMetadata,
    echoAppId: isFreeTier ? echoAppId : undefined,
  };

  await processPaymentUpdate(tx, paymentData);

  console.log(
    `Credits minted for user ${userId}: $${amountInDollars}${
      isFreeTier
        ? ` (free tier pool for app ${echoAppId})`
        : ' (personal balance)'
    }`
  );
}
