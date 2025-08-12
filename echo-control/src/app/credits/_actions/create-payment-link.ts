'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import {
  createPaymentLink as createStripePaymentLink,
  isValidUrl,
  CreatePaymentLinkBody,
} from '@/lib/stripe/payment-link';

export async function createPaymentLink(body: CreatePaymentLinkBody) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  // Validate callback URLs if provided
  if (body.successUrl && !isValidUrl(body.successUrl)) {
    throw new Error('Invalid success URL format');
  }

  const result = await createStripePaymentLink(session.user.id, body);

  return redirect(result.paymentLink.url);
}
