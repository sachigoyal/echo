import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// POST /api/stripe/payment-link - Generate real Stripe payment link for authenticated user
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    const body = await request.json();
    const { amount, description = 'Echo Credits' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
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
        amount: amountInCents,
        currency: 'usd',
        status: 'pending',
        description: description,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        paymentLink: {
          id: paymentLink.id,
          url: paymentLink.url,
          amount: amountInCents,
          currency: 'usd',
          status: 'pending',
          created: Math.floor(Date.now() / 1000),
          metadata: {
            userId: user.id,
            description,
          },
        },
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment link:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: 'Stripe error: ' + error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
