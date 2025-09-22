import z from 'zod';

import { getAppWithOwnerCheck } from '@/services/db/ops/apps/get';
import { env } from '@/env';
import { createPaymentLink, createPaymentLinkSchema } from './lib';

export const createFreeTierPaymentLinkSchema = createPaymentLinkSchema
  .pick({
    amount: true,
  })
  .extend({
    appId: z.uuid(),
    poolName: z.string().optional().default('Free Tier Credits'),
    defaultSpendLimit: z.number().optional().default(100),
  });

export const createFreeTierPaymentLink = async (
  userId: string,
  {
    amount,
    poolName,
    defaultSpendLimit,
    appId,
  }: z.infer<typeof createFreeTierPaymentLinkSchema>
) => {
  // Verify the app exists and user has access
  const app = await getAppWithOwnerCheck(appId, userId);

  if (!app) {
    throw new Error('App not found');
  }

  const description = `${poolName} for ${app.name} - ${amount} USD`;

  return await createPaymentLink(userId, {
    amount,
    name: `${poolName} - ${app.name}`,
    description,
    successUrl: `${env.NEXT_PUBLIC_APP_URL}/app/${appId}/free-tier?payment=success&type=free-tier`,
    metadata: {
      userId,
      echoAppId: appId,
      description,
      poolName,
      type: 'free-tier-credits',
      defaultSpendLimit: defaultSpendLimit.toString(),
    },
  });
};
