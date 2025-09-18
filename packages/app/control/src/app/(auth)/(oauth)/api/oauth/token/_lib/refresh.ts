import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { logger } from '@/logger';
import { env } from '@/env';
import { TokenMetadata } from './types';
import { addSeconds, differenceInSeconds, subMilliseconds } from 'date-fns';
import { createEchoAccessJwt } from './create-jwt';
import z from 'zod';
import { Prisma } from '@/generated/prisma';
import { tokenResponse } from './response';

export const handleRefreshTokenSchema = z.object({
  refresh_token: z.string(),
});

export async function handleRefreshToken(
  { refresh_token: token }: z.output<typeof handleRefreshTokenSchema>,
  metadata?: TokenMetadata
) {
  logger.emit({
    severityText: 'INFO',
    body: 'Processing refresh token request',
    attributes: {
      function: 'handleRefreshToken',
    },
  });

  const refreshToken = await db.refreshToken.findUnique({
    where: {
      token,
      OR: [
        { isArchived: false, archivedAt: null },
        {
          isArchived: true,
          archivedAt: {
            lt: subMilliseconds(
              new Date(),
              env.OAUTH_REFRESH_TOKEN_ARCHIVE_GRACE_MS
            ),
          },
          expiresAt: { lt: new Date() },
        },
      ],
      session: { isArchived: false, revokedAt: null },
      echoApp: { isArchived: false },
      user: { isArchived: false },
    },
    include: {
      user: true,
      echoApp: true,
      session: true,
    },
  });

  if (!refreshToken) {
    throw new Error('Refresh token not found');
  }

  if (refreshToken.expiresAt < new Date()) {
    // Deactivate expired token
    archiveRefreshToken(token);
    throw new Error('Refresh token expired');
  }

  if (refreshToken.archivedAt) {
    console.warn('🔄 Allowed a refresh for archived token within grace period');
  }

  const { user, echoApp: app, session, scope } = refreshToken;

  if (!session) {
    throw new Error('Session not found');
  }

  const sessionId = session.id;

  // Deactivate old refresh token
  await archiveRefreshToken(token);

  const newRefreshToken = await db.$transaction(async tx => {
    const [newRefreshToken] = await Promise.all([
      await createRefreshToken(
        {
          userId: user.id,
          echoAppId: app.id,
          scope,
          sessionId,
        },
        tx
      ),
      await db.appSession.update({
        where: { id: sessionId },
        data: {
          lastSeenAt: new Date(),
          ...(metadata?.userAgent ? { userAgent: metadata.userAgent } : {}),
          ...(metadata?.ipAddress ? { ipAddress: metadata.ipAddress } : {}),
          ...(metadata?.deviceName ? { deviceName: metadata.deviceName } : {}),
        },
      }),
    ]);

    return newRefreshToken;
  });

  const accessToken = await createEchoAccessJwt({
    userId: user.id,
    appId: app.id,
    scope,
    sessionId,
  });

  return tokenResponse({
    user,
    app,
    accessToken,
    refreshToken: newRefreshToken,
  });
}

const archiveRefreshToken = async (refreshToken: string) => {
  await db.refreshToken.update({
    where: { token: refreshToken },
    data: { isArchived: true, archivedAt: new Date() },
  });
};

const createRefreshTokenParamsSchema = z.object({
  userId: z.uuid(),
  echoAppId: z.uuid(),
  scope: z.string().default(''),
  sessionId: z.uuid(),
});

export const createRefreshToken = async (
  params: z.input<typeof createRefreshTokenParamsSchema>,
  tx?: Prisma.TransactionClient
) => {
  const client = tx ?? db;
  const tokenData = createRefreshTokenParamsSchema.parse(params);
  return client.refreshToken.create({
    data: {
      token: `refresh_${nanoid(48)}`,
      expiresAt: createEchoRefreshTokenExpiry(),
      ...tokenData,
    },
  });
};

const createEchoRefreshTokenExpiry = () => {
  const expiry = addSeconds(new Date(), env.OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS);
  logger.emit({
    severityText: 'DEBUG',
    body: 'Echo refresh token expiry calculated',
    attributes: {
      expiryTime: expiry.toISOString(),
      function: 'createEchoRefreshTokenExpiry',
    },
  });
  return expiry;
};
