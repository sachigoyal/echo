import type Stripe from 'stripe';

import { updatePaymentStatus } from '@/services/db/ops/payments/update';
import { PaymentStatus } from '@/types/payments';
import { logger } from '@/logger';

export const handlePaymentFailure = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  try {
    const { id } = paymentIntent;

    await updatePaymentStatus(id, PaymentStatus.FAILED);

    logger.emit({
      severityText: 'WARN',
      body: 'Payment failed',
      attributes: {
        paymentIntentId: id,
        handler: 'handlePaymentFailure',
      },
    });
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error handling payment failure',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        handler: 'handlePaymentFailure',
      },
    });
  }
};
