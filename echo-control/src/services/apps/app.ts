import z from 'zod';

import { db } from '@/lib/db';

import { appSelect } from './lib/select';
import { AppId } from './lib/schemas';

import { AppRole, MembershipStatus } from '@/lib/permissions';

export const getApp = async (appId: AppId) => {
  return await db.echoApp.findUnique({
    where: { id: appId },
    select: appSelect,
  });
};

export const getAppOwner = async (appId: AppId) => {
  const owner = await db.appMembership.findFirst({
    where: {
      echoAppId: appId,
      role: AppRole.OWNER,
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return owner?.user;
};

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

export const updateAppSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    homepageUrl: z.url().optional(),
    profilePictureUrl: z.url().optional(),
    authorizedCallbackUrls: z.array(z.string()).optional(),
  })
  .refine(data => Object.values(data).some(value => value !== undefined), {
    message: 'At least one field must be provided',
    path: [],
  });

export const updateApp = async (
  appId: AppId,
  userId: string,
  data: z.infer<typeof updateAppSchema>
) => {
  const validatedData = updateAppSchema.safeParse(data);

  if (!validatedData.success) {
    throw new Error(validatedData.error.message);
  }

  return await db.echoApp.update({
    where: {
      id: appId,
      appMemberships: { some: { userId, role: AppRole.OWNER } },
    },
    data: Object.fromEntries(
      Object.entries(validatedData.data).filter(
        ([, value]) => value !== undefined
      )
    ),
  });
};
