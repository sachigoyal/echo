import { NextResponse } from 'next/server';

import { handleStripeEvent } from '@/services/stripe/webhook/handle-event';

import { logger } from '@/logger';

import type { NextRequest } from 'next/server';
import { constructStripeEvent } from '@/services/stripe/webhook/construct-event';

// POST /api/stripe/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = constructStripeEvent(request, body);

    logger.emit({
      severityText: 'INFO',
      body: 'Received Stripe webhook',
      attributes: {
        eventType: event.type,
        eventId: event.id,
      },
    });

    await handleStripeEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Webhook handler failed',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
