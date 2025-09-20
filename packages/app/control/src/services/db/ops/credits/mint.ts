import z from 'zod';

import { db } from '@/services/db/client';
import { processPaymentUpdate, PaymentStatus } from '@/lib/payment-processing';

import type { Payment } from '@/generated/prisma';
import { EnumPaymentSource, type Prisma } from '@/generated/prisma';
import { logger } from '@/logger';
import { updateSpendPoolFromPayment } from '@/lib/spend-pools';
import { Decimal } from '@/generated/prisma/runtime/library';
import type { User } from '@auth/core/types';

export const mintCreditsToUserSchema = z.object({
  userId: z.uuid(),
  amountInDollars: z.number().min(0.01),
  options: z
    .object({
      isFreeTier: z.boolean().optional(),
      echoAppId: z.string().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
      poolName: z.string().optional(),
      defaultSpendLimit: z.number().positive().optional(),
      description: z.string().optional(),
      source: z.enum(EnumPaymentSource),
    })
    .refine(
      data => {
        return !(data.isFreeTier && !data.echoAppId);
      },
      {
        message: 'echoAppId is required for free tier credit minting',
      }
    ),
});

export const mintCreditsToUser = async (
  input: z.infer<typeof mintCreditsToUserSchema>,
  tx?: Prisma.TransactionClient
) => {
  const client = tx ?? db;

  const result = mintCreditsToUserSchema.safeParse(input);

  if (!result.success) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Invalid input for credit minting',
      attributes: {
        validationError: result.error.message,
        input: JSON.stringify(input),
        function: 'mintCreditsToUser',
      },
    });
    throw new Error(result.error.message, { cause: result.error });
  }

  const { userId, amountInDollars, options } = result.data;

  const {
    isFreeTier = false,
    echoAppId,
    metadata = {},
    poolName,
    defaultSpendLimit,
    description = options.isFreeTier
      ? 'Free-Tier Credit Redemption Payment'
      : 'A Gift from the Echo Team',
    source,
  } = options;

  // Convert dollars to cents for storage
  const amountInCents = Math.round(amountInDollars * 100);

  // Generate a unique payment ID for tracking
  const paymentId = `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create payment record
  const paymentRecord = await client.payment.create({
    data: {
      paymentId: paymentId,
      amount: amountInDollars,
      currency: 'usd',
      status: PaymentStatus.COMPLETED,
      source: source,
      description,
      userId,
    },
  });

  await processPaymentUpdate(client, {
    userId,
    amountInCents,
    paymentRecord,
    metadata: {
      ...metadata,
      type: isFreeTier ? 'free-tier-credits' : 'admin-issued',
      mintedAt: new Date().toISOString(),
      ...(poolName && { poolName }),
      ...(defaultSpendLimit && {
        defaultSpendLimit: defaultSpendLimit.toString(),
      }),
    },
    echoAppId: isFreeTier ? echoAppId : undefined,
  });

  logger.emit({
    severityText: 'INFO',
    body: 'Successfully minted credits to user',
    attributes: {
      userId,
      amountInDollars,
      amountInCents,
      isFreeTier,
      echoAppId,
      paymentId,
      poolName,
      function: 'mintCreditsToUser',
    },
  });

  return {
    userId,
    amountInDollars,
    echoAppId,
    isFreeTier,
  };
};

export const createFreeTierPaymentFromBalanceSchema = z.object({
  appId: z.string(),
  amountInDollars: z.number(),
});

export async function createFreeTierPaymentFromBalance(
  ctx: { session: { user: User } },
  input: z.infer<typeof createFreeTierPaymentFromBalanceSchema>
): Promise<{
  success: boolean;
  freeTierPayment: Payment | null;
  error_message: string | null;
}> {
  const validationResult =
    createFreeTierPaymentFromBalanceSchema.safeParse(input);

  if (!validationResult.success) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Invalid input for credit minting',
      attributes: {
        validationError: validationResult.error.message,
        input: JSON.stringify(input),
        function: 'createFreeTierPaymentFromBalance',
      },
    });
    throw new Error(validationResult.error.message, {
      cause: validationResult.error,
    });
  }

  const { appId, amountInDollars } = validationResult.data;
  const echoAppId = await db.echoApp.findUnique({
    where: { id: appId },
  });

  if (!echoAppId) {
    throw new Error('Echo app not found');
  }

  const userId = ctx.session.user.id;

  if (!userId) {
    throw new Error('User not found');
  }

  const amountInDollarsDecimal = new Decimal(amountInDollars);
  const amountInCentsDecimal = amountInDollarsDecimal.mul(100);

  const freeTierPaymentId = `free_tier_from_balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await db.$transaction(async client => {
    // check if the user has enough balance
    const user = await client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        freeTierPayment: null,
        error_message: 'User not found',
      };
    }

    const currentUserBalance = user.totalPaid.minus(user.totalSpent);

    if (currentUserBalance.lessThan(amountInDollarsDecimal)) {
      return {
        success: false,
        freeTierPayment: null,
        error_message: 'Insufficient balance to complete transaction.',
      };
    }

    const freeTierPayment = await client.payment.create({
      data: {
        paymentId: freeTierPaymentId,
        userId: userId,
        amount: amountInDollars,
        currency: 'usd',
        status: PaymentStatus.COMPLETED,
        source: EnumPaymentSource.balance,
        description: 'Free Tier Credit Redemption Payment from Balance',
      },
    });

    await updateSpendPoolFromPayment(
      client,
      echoAppId.id,
      freeTierPayment,
      Number(amountInCentsDecimal),
      {}
    );

    // decrement the user's balance
    await client.user.update({
      where: { id: userId },
      data: {
        totalSpent: {
          increment: amountInDollarsDecimal,
        },
      },
    });
    const transactionMetadata = await client.transactionMetadata.create({
      data: {
        providerId: freeTierPaymentId,
        provider: 'balance_transfer',
        model: 'balance_transfer',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    });
    await client.transaction.create({
      data: {
        userId,
        totalCost: amountInDollarsDecimal,
        rawTransactionCost: amountInDollarsDecimal,
        status: 'success',
        echoAppId: echoAppId.id,
        transactionMetadataId: transactionMetadata.id,
      },
    });

    return {
      success: true,
      freeTierPayment,
      error_message: null,
    };
  });

  return result;
}
