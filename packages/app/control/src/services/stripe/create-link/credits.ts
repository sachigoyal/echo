import z from 'zod';

import { env } from '@/env';

import { createPaymentLink, createPaymentLinkSchema } from './lib';

export const createCreditsPaymentLinkSchema = createPaymentLinkSchema
  .pick({
    amount: true,
  })
  .extend({
    name: z.string().default('Echo Credits'),
    successUrl: z
      .url()
      .default(`${env.NEXT_PUBLIC_APP_URL}/credits?payment=success`),
  });

export const createCreditsPaymentLink = async (
  userId: string,
  { amount, name, successUrl }: z.infer<typeof createCreditsPaymentLinkSchema>
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
