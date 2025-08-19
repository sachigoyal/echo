import { z } from 'zod';

import { db } from '@/lib/db';

import { AppRole, MembershipStatus } from '@/lib/permissions/types';

export const createAppSchema = z.object({
  name: z
    .string()
    .min(1, 'App name is required')
    .max(100, 'App name must be 100 characters or less'),
  markup: z
    .number()
    .min(1, 'Markup must be greater than 0')
    .max(100, 'Markup must be less than 100'),
});

export const createApp = async (
  userId: string,
  data: z.infer<typeof createAppSchema>
) => {
  const validatedData = createAppSchema.safeParse(data);

  if (!validatedData.success) {
    throw new Error(validatedData.error.message);
  }

  return await db.echoApp.create({
    data: {
      name: data.name.trim(),
      markUp: {
        create: {
          amount: data.markup,
        },
      },
      appMemberships: {
        create: {
          userId,
          role: AppRole.OWNER,
          status: MembershipStatus.ACTIVE,
          isArchived: false,
          totalSpent: 0,
        },
      },
      authorizedCallbackUrls: [],
    },
  });
};
