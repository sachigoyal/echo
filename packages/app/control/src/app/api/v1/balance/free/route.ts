// this route is deprecated, use the /api/v1/balance/{id}/free route instead
// keeping as the old versions of the SDK expect this route

import { z } from 'zod';

import { NextResponse } from 'next/server';

import { appIdSchema } from '@/services/apps/lib/schemas';

import { getCustomerSpendInfoForApp } from '@/lib/spend-pools/fetch-user-spend';
import { authRoute } from '@/lib/api/auth-route';

const getFreeBalanceBodySchema = z.object({
  echoAppId: appIdSchema,
});

export const POST = authRoute
  .body(getFreeBalanceBodySchema)
  .handler(async (_, context) => {
    const { echoAppId } = context.body;

    const spendPoolInfo = await getCustomerSpendInfoForApp(
      context.ctx.userId,
      echoAppId
    );

    return NextResponse.json(spendPoolInfo);
  });
