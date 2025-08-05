import { updateSpendPoolFromPayment } from './spend-pools';
import { updateUserBalanceFromPayment } from './balance';
import type { Payment } from '@/generated/prisma';
import type { PrismaClient } from '@/generated/prisma';

export interface PaymentProcessingData {
  userId: string;
  amountInCents: number;
  paymentRecord: Payment;
  metadata?: Record<string, string>;
  echoAppId?: string;
}

/**
 * Process a payment by updating either free tier spend pools or user personal balance
 * @param tx - The database transaction
 * @param data - Payment processing data
 */
export async function processPaymentUpdate(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  data: PaymentProcessingData
): Promise<void> {
  const { userId, amountInCents, paymentRecord, metadata, echoAppId } = data;

  // Handle free tier pool creation and funding if this is a free tier payment
  if (metadata?.type === 'free-tier-credits' && echoAppId && paymentRecord) {
    await updateSpendPoolFromPayment(
      tx,
      echoAppId,
      paymentRecord,
      amountInCents,
      metadata
    );

    console.log(
      `Free tier payment processed for app ${echoAppId}: $${amountInCents / 100}`
    );
  } else {
    // For non-free-tier payments, update user's totalPaid balance
    await updateUserBalanceFromPayment(tx, userId, amountInCents);

    console.log(
      `Personal balance updated for user ${userId}: +$${amountInCents / 100}`
    );
  }
}
