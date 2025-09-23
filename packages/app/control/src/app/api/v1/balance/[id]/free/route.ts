import { z } from 'zod';

import { NextResponse } from 'next/server';

import { getUserSpendInfoForApp } from '@/services/db/user/app-spend-pool';

import { authRoute } from '@/lib/api/auth-route';

const getFreeBalanceParamsSchema = z.object({
  id: z.uuid(),
});

export const GET = authRoute
  .params(getFreeBalanceParamsSchema)
  .handler(async (_, context) => {
    const { id } = context.params;

    const spendPoolInfo = await getUserSpendInfoForApp(context.ctx.userId, id);

    return NextResponse.json(spendPoolInfo);
  });
