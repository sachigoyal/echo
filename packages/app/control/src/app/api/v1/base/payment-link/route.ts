import { NextResponse } from 'next/server';
import z from 'zod';
import { authRoute } from '../../../../../lib/api/auth-route';
import { handlePaymentSuccess } from '@/services/db/ops/payments/success';
import { logger } from '@/logger';

const querySchema = z.object({
  amount: z.number().positive(),
});

export const GET = authRoute.query(querySchema).handler(async (_, context) => {
  const { amount } = context.query;

  const userId = context.ctx.userId;
  const amountInCents = amount * 100;

  const metadata = {
    'payment-type': 'x402',
    'transaction-id': 'x402_' + crypto.randomUUID(),
    amount: amount.toString(),
    currency: 'usd',
  };

  try {
    await handlePaymentSuccess({
      userId,
      amountInCents,
      currency: 'usd',
      paymentId: metadata['transaction-id'],
      metadata,
      description: 'Echo credits purchase with x402',
    });

    logger.emit({
      severityText: 'INFO',
      body: 'Payment succeeded',
      attributes: {
        transactionId: metadata['transaction-id'],
        isFreeTier: false,
        userId,
        function: 'handlePaymentSuccessFromx402',
      },
    });

    return NextResponse.json(
      { message: 'Payment created successfully' },
      { status: 201 }
    );
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error handling payment success',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        function: 'handlePaymentSuccessFromx402',
      },
    });
  }
});
