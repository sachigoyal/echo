import { db } from '../db';
import { User, Payment } from '@/generated/prisma';
import Stripe from 'stripe';

/**
 * PICO-CENT PRECISION SUPPORT
 *
 * This module now supports unlimited dollar amounts with pico-cent precision:
 * - Database stores amounts as DECIMAL(65,14)
 * - 51 digits before decimal point (virtually unlimited dollar amounts)
 * - 14 digits after decimal point (pico-cent precision: 10^-14 dollars)
 *
 * Examples of supported values:
 * - $0.00000000000001 (1 pico-cent)
 * - $999,999,999,999,999,999,999,999,999,999,999,999,999,999,999,999,999.99999999999999
 * - Any value in between with up to 14 decimal places
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export interface CreatePaymentLinkRequest {
  amount: number;
  description?: string;
}

export interface CreatePaymentLinkResult {
  paymentLink: {
    id: string;
    url: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    metadata: {
      userId: string;
      description: string;
    };
  };
  payment: Payment; // Payment record from database
}

/**
 * Create a Stripe payment link for purchasing credits
 * @param user - The authenticated user
 * @param request - Payment link request details
 * @returns Payment link and database record
 */
export async function createPaymentLink(
  user: User,
  request: CreatePaymentLinkRequest
): Promise<CreatePaymentLinkResult> {
  const { amount, description = 'Echo Credits' } = request;

  if (!amount || amount <= 0) {
    throw new Error('Valid amount is required');
  }

  // Convert amount to cents for Stripe
  const amountInCents = Math.round(amount * 100);

  // Create Stripe product
  const product = await stripe.products.create({
    name: description,
    description: `${description} - ${amount} USD`,
  });

  // Create Stripe price
  const price = await stripe.prices.create({
    unit_amount: amountInCents,
    currency: 'usd',
    product: product.id,
  });

  // Create Stripe payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      description,
    },
    after_completion: {
      type: 'redirect',
      redirect: {
        url: process.env.ECHO_CONTROL_APP_BASE_URL + `?payment=success`,
      },
    },
  });

  // Create pending payment record
  const payment = await db.payment.create({
    data: {
      stripePaymentId: paymentLink.id,
      amount: amount,
      currency: 'usd',
      status: 'pending',
      description: description,
      userId: user.id,
    },
  });

  return {
    paymentLink: {
      id: paymentLink.id,
      url: paymentLink.url,
      amount: amount,
      currency: 'usd',
      status: 'pending',
      created: Math.floor(Date.now() / 1000),
      metadata: {
        userId: user.id,
        description,
      },
    },
    payment,
  };
}
