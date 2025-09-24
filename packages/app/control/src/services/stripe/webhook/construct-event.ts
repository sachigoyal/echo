import { stripe } from '../client';

import { env } from '@/env';
import { logger } from '@/logger';

import type { NextRequest } from 'next/server';

export const constructStripeEvent = (request: NextRequest, body: string) => {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    throw new Error('Missing signature');
  }

  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Webhook signature verification failed',
      attributes: {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
    });
    throw err;
  }
};
