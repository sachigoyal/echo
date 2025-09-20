import z from 'zod';

import { db } from '../../client';

import type { Prisma } from '@/generated/prisma';

const metdataSchema = z.object({
  deviceName: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

const createAppSessionParamsSchema = z.object({
  userId: z.uuid(),
  appId: z.uuid(),
  metadata: metdataSchema.optional(),
});

export const createAppSession = async (
  params: z.input<typeof createAppSessionParamsSchema>,
  tx?: Prisma.TransactionClient
) => {
  const client = tx ?? db;
  const { userId, appId, metadata } =
    createAppSessionParamsSchema.parse(params);
  return client.appSession.create({
    data: {
      userId: userId,
      echoAppId: appId,
      deviceName: metadata?.deviceName,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    },
  });
};

const updateAppSessionParamsSchema = z.object({
  sessionId: z.uuid(),
  metadata: metdataSchema.optional(),
});

export const updateAppSession = async (
  params: z.input<typeof updateAppSessionParamsSchema>,
  tx?: Prisma.TransactionClient
) => {
  const client = tx ?? db;
  const { sessionId, metadata } = updateAppSessionParamsSchema.parse(params);
  return await client.appSession.update({
    where: { id: sessionId },
    data: {
      lastSeenAt: new Date(),
      ...(metadata?.userAgent ? { userAgent: metadata.userAgent } : {}),
      ...(metadata?.ipAddress ? { ipAddress: metadata.ipAddress } : {}),
      ...(metadata?.deviceName ? { deviceName: metadata.deviceName } : {}),
    },
  });
};
