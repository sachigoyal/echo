import z from 'zod';

import { env } from '@/env';

import { createPaymentLink } from './lib';

export const createCreditsPaymentLinkSchema = z.object({
  amount: z.number().min(1),
  description: z.string().default('Echo Credits'),
  successUrl: z
    .url()
    .default(`${env.NEXT_PUBLIC_APP_URL}/credits?payment=success`),
});

export const createCreditsPaymentLink = async (
  userId: string,
  {
    amount,
    // wonky cuz sdk expects description
    description: name,
    successUrl,
  }: z.infer<typeof createCreditsPaymentLinkSchema>
) => {
  const description = `${name} - ${amount} USD`;
  return createPaymentLink(userId, {
    amount,
    name,
    description,
    successUrl,
    metadata: {
      userId,
      description,
    },
  });
};
