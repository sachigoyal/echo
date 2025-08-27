import { db } from '@/lib/db';

import type { AppId } from './lib/schemas';
import z from 'zod';
import { AppRole } from '@/lib/permissions';

export const getAppMarkup = async (appId: AppId) => {
  return await db.markUp.findUnique({
    where: { echoAppId: appId },
    select: {
      amount: true,
    },
  });
};

export const updateMarkupSchema = z.object({
  markup: z
    .number()
    .min(1, 'Markup must be greater than 0')
    .max(100, 'Markup must be less than 100'),
});

export const updateMarkup = async (
  appId: AppId,
  userId: string,
  data: z.infer<typeof updateMarkupSchema>
) => {
  const validatedData = updateMarkupSchema.safeParse(data);

  if (!validatedData.success) {
    throw new Error(validatedData.error.message);
  }

  return await db.markUp.upsert({
    where: {
      echoAppId: appId,
      echoApp: {
        appMemberships: { some: { userId, role: AppRole.OWNER } },
      },
    },
    update: {
      amount: data.markup,
    },
    create: {
      echoAppId: appId,
      amount: data.markup,
    },
  });
};
