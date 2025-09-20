// this route is deprecated, use the /api/v1/balance/{id}/free route instead
// keeping as the old versions of the SDK expect this route

import { z } from 'zod';

import { NextResponse } from 'next/server';

import { getUserSpendInfoForApp } from '@/services/db/ops/user/app-spend-pool';

import { authRoute } from '@/lib/api/auth-route';

const getFreeBalanceBodySchema = z.object({
  echoAppId: z.uuid(),
});

export const POST = authRoute
  .body(getFreeBalanceBodySchema)
  .handler(async (_, context) => {
    const { echoAppId } = context.body;

    const spendPoolInfo = await getUserSpendInfoForApp(
      context.ctx.userId,
      echoAppId
    );

    return NextResponse.json(spendPoolInfo);
  });
