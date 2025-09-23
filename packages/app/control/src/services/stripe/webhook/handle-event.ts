import type Stripe from 'stripe';

import { handleCheckoutSessionCompleted } from './handlers/checkout-completed';
import { handlePaymentFailure } from './handlers/payment-failure';
import { handleInvoicePayment } from './handlers/invoice-payment';

import { logger } from '@/logger';

export const handleStripeEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(event.data.object);
      break;
    default:
      logger.emit({
        severityText: 'WARN',
        body: 'Unhandled Stripe webhook event type',
        attributes: {
          eventType: event.type,
          eventId: event.id,
        },
      });
  }
};
