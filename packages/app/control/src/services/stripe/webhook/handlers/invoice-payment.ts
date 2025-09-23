import { logger } from '@/logger';

import type Stripe from 'stripe';

export const handleInvoicePayment = async (invoice: Stripe.Invoice) => {
  try {
    const { id, amount_paid, currency } = invoice;

    // Handle recurring payments if needed
    logger.emit({
      severityText: 'INFO',
      body: 'Invoice payment received',
      attributes: {
        invoiceId: id,
        amount_paid,
        currency,
        handler: 'handleInvoicePayment',
      },
    });
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error handling invoice payment',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        handler: 'handleInvoicePayment',
      },
    });
  }
};
