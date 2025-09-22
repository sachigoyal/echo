import type Stripe from 'stripe';

import { handlePaymentSuccess as handlePaymentSuccessDb } from '@/services/db/ops/payments/success';

import { logger } from '@/logger';

export const handlePaymentSuccess = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  try {
    const { id, amount, currency, metadata } = paymentIntent;
    const userId = metadata?.userId;

    if (!userId) {
      console.error('No userId in payment metadata');
      return;
    }

    // Use a database transaction to atomically update payment status and user balance
    await handlePaymentSuccessDb({
      userId,
      amountInCents: amount,
      currency,
      paymentId: id,
      metadata,
      echoAppId: metadata?.echoAppId,
    });

    logger.emit({
      severityText: 'INFO',
      body: 'Payment succeeded',
      attributes: {
        paymentIntentId: id,
        isFreeTier: metadata?.type === 'free-tier-credits',
        function: 'handlePaymentSuccess',
      },
    });
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error handling payment success',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        paymentIntentId: paymentIntent.id,
        function: 'handlePaymentSuccess',
      },
    });
  }
};
