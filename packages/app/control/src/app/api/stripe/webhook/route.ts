import Stripe from 'stripe';

import { NextResponse } from 'next/server';

import { handlePaymentFailure } from '@/services/stripe/webhook/payment-failure';
import { handlePaymentSuccess } from '@/services/stripe/webhook/payment-success';
import { handleInvoicePayment } from '@/services/stripe/webhook/invoice-payment';
import { handleCheckoutSessionCompleted } from '@/services/stripe/webhook/checkout-completed';

import { logger } from '@/logger';
import { env } from '@/env';

import type { NextRequest } from 'next/server';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

// POST /api/stripe/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.emit({
        severityText: 'ERROR',
        body: 'Webhook signature verification failed',
        attributes: {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    logger.emit({
      severityText: 'INFO',
      body: 'Received Stripe webhook',
      attributes: {
        eventType: event.type,
        eventId: event.id,
      },
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
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
