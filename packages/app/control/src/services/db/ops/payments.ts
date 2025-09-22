import { updateSpendPoolFromPayment } from '@/services/db/ops/apps/free-tier';
import { logger } from '@/logger';

import { updateUserBalanceFromPayment } from './user/balance';

import type { Prisma } from '@/generated/prisma';

interface PaymentProcessingData {
  userId: string;
  amountInCents: number;
  paymentId: string;
  metadata?: Record<string, string>;
  echoAppId?: string;
}

export async function processPaymentUpdate(
  tx: Prisma.TransactionClient,
  data: PaymentProcessingData
): Promise<void> {
  const { userId, amountInCents, paymentId, metadata, echoAppId } = data;

  // Handle free tier pool creation and funding if this is a free tier payment
  if (metadata?.type === 'free-tier-credits' && echoAppId && paymentId) {
    await updateSpendPoolFromPayment(tx, {
      echoAppId,
      paymentId,
      amountInCents,
      metadata,
    });

    logger.emit({
      severityText: 'INFO',
      body: 'Free tier payment processed',
      attributes: {
        echoAppId,
        amountInCents,
        amountInDollars: amountInCents / 100,
        function: 'processPaymentUpdate',
      },
    });
  } else {
    // For non-free-tier payments, update user's totalPaid balance
    await updateUserBalanceFromPayment(tx, {
      userId,
      amountInCents,
    });

    logger.emit({
      severityText: 'INFO',
      body: 'Personal balance updated for user',
      attributes: {
        userId,
        amountInCents,
        amountInDollars: amountInCents / 100,
        function: 'processPaymentUpdate',
      },
    });
  }
}
