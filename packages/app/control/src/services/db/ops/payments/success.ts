import { db } from '../../client';

import { updateSpendPoolFromPayment } from '../apps/free-tier';
import { updateUserBalanceFromPayment } from '../user/balance';

import { logger } from '@/logger';

import { PaymentStatus } from '@/types/payments';

import type { EnumPaymentSource, Prisma } from '@/generated/prisma';

interface PaymentSuccessData {
  userId: string;
  amountInCents: number;
  currency: string;
  paymentId: string;
  metadata: Record<string, string>;
  source?: EnumPaymentSource;
  echoAppId?: string;
  description?: string;
}

export const handlePaymentSuccess = async (
  data: PaymentSuccessData,
  tx?: Prisma.TransactionClient
) => {
  if (tx) {
    await handlePaymentSuccessInternal(data, tx);
  } else {
    await db.$transaction(async tx => {
      await handlePaymentSuccessInternal(data, tx);
    });
  }
};

const handlePaymentSuccessInternal = async (
  data: PaymentSuccessData,
  tx: Prisma.TransactionClient
) => {
  const {
    userId,
    amountInCents,
    currency,
    paymentId,
    metadata,
    echoAppId,
    description,
    source,
  } = data;

  const paymentRecord = await tx.payment.upsert({
    where: { paymentId },
    update: { status: PaymentStatus.COMPLETED },
    create: {
      paymentId,
      amount: amountInCents / 100,
      currency,
      status: PaymentStatus.COMPLETED,
      description: description ?? 'Echo credits purchase',
      userId,
      source,
    },
  });

  // Handle free tier pool creation and funding if this is a free tier payment
  if (metadata.type === 'free-tier-credits' && echoAppId) {
    await updateSpendPoolFromPayment(tx, {
      echoAppId,
      paymentId: paymentRecord.paymentId,
      amountInCents,
      metadata,
    });

    logger.emit({
      severityText: 'INFO',
      body: 'Free tier payment processed',
      attributes: {
        echoAppId,
        amount: amountInCents,
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
        amount: amountInCents,
        amountInDollars: amountInCents / 100,
        function: 'processPaymentUpdate',
      },
    });
  }
};
