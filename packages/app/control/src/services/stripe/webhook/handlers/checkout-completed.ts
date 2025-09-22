import type Stripe from 'stripe';

import { getPaymentById } from '@/services/db/payments/get';
import { handlePaymentSuccess } from '@/services/db/payments/success';

import { logger } from '@/logger';

import { PaymentStatus } from '@/types/payments';

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
) => {
  console.log('handleCheckoutSessionCompleted');
  try {
    const { metadata, amount_total, currency, payment_link, payment_intent } =
      session;
    const userId = metadata?.userId;
    const echoAppId = metadata?.echoAppId;
    const description = metadata?.description;

    if (!userId || !amount_total) {
      logger.emit({
        severityText: 'ERROR',
        body: 'Missing userId or amount in checkout session metadata',
        attributes: {
          sessionId: session.id,
          userId,
          amount_total,
          handler: 'handleCheckoutSessionCompleted',
        },
      });
      return;
    }

    // Determine the payment ID to update based on whether this is from a payment link
    let paymentId: string;
    if (payment_link) {
      // This checkout session was created from a payment link
      paymentId = payment_link as string;
      logger.emit({
        severityText: 'INFO',
        body: 'Checkout session completed from payment link',
        attributes: {
          paymentId,
          sessionId: session.id,
          handler: 'handleCheckoutSessionCompleted',
        },
      });
    } else if (payment_intent) {
      // This is a direct checkout session
      paymentId = session.id;
      logger.emit({
        severityText: 'INFO',
        body: 'Direct checkout session completed',
        attributes: {
          paymentId,
          sessionId: session.id,
          handler: 'handleCheckoutSessionCompleted',
        },
      });
    } else {
      logger.emit({
        severityText: 'ERROR',
        body: 'No payment_link or payment_intent found in checkout session',
        attributes: {
          sessionId: session.id,
          handler: 'handleCheckoutSessionCompleted',
        },
      });
      return;
    }

    const payment = await getPaymentById(paymentId);

    if (!payment) {
      logger.emit({
        severityText: 'ERROR',
        body: 'Payment not found',
        attributes: {
          paymentId,
          handler: 'handleCheckoutSessionCompleted',
        },
      });
      return;
    }

    if ((payment.status as PaymentStatus) === PaymentStatus.COMPLETED) {
      logger.emit({
        severityText: 'ERROR',
        body: 'Payment already completed',
        attributes: {
          paymentId,
          handler: 'handleCheckoutSessionCompleted',
        },
      });
      return;
    }

    await handlePaymentSuccess({
      userId,
      amountInCents: amount_total,
      currency: currency ?? 'usd',
      paymentId,
      metadata,
      echoAppId,
      description,
    });

    logger.emit({
      severityText: 'INFO',
      body: 'Checkout completed successfully',
      attributes: {
        userId,
        echoAppId,
        creditsAdded: Math.floor(amount_total / 100),
        isFreeTier: metadata?.type === 'free-tier-credits',
        handler: 'handleCheckoutSessionCompleted',
      },
    });
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error handling checkout completion',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        handler: 'handleCheckoutSessionCompleted',
      },
    });
  }
};
