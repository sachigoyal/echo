import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { logger } from '@/logger';
import { env } from '@/env';
import { TokenMetadata } from './types';
import { addSeconds, differenceInSeconds, subMilliseconds } from 'date-fns';
import { createEchoAccessJwt } from './create-jwt';
import z from 'zod';

export const handleRefreshTokenSchema = z.object({
  refresh_token: z.string(),
});

export async function handleRefreshToken(
  { refresh_token }: z.output<typeof handleRefreshTokenSchema>,
  metadata?: TokenMetadata
) {
  logger.emit({
    severityText: 'INFO',
    body: 'Processing refresh token request',
    attributes: {
      function: 'handleRefreshToken',
    },
  });

  const echoRefreshTokenRecord = await db.refreshToken.findUnique({
    where: {
      token: refresh_token,
      OR: [
        {
          isArchived: false,
          archivedAt: null,
        },
        {
          isArchived: true,
          archivedAt: {
            lt: subMilliseconds(
              new Date(),
              env.OAUTH_REFRESH_TOKEN_ARCHIVE_GRACE_MS
            ),
          },
          expiresAt: {
            lt: new Date(),
          },
        },
      ],
      session: {
        isArchived: false,
        revokedAt: null,
      },
      echoApp: {
        isArchived: false,
      },
      user: {
        isArchived: false,
      },
    },
    include: {
      user: true,
      echoApp: true,
      session: true,
    },
  });

  if (!echoRefreshTokenRecord) {
    throw new Error('Refresh token not found');
  }

  if (echoRefreshTokenRecord.expiresAt < new Date()) {
    // Deactivate expired token
    archiveRefreshToken(refresh_token);
    throw new Error('Refresh token expired');
  }

  if (echoRefreshTokenRecord.archivedAt) {
    console.warn('🔄 Allowed a refresh for archived token within grace period');
  }

  const { user, echoApp, session, scope } = echoRefreshTokenRecord;

  if (!session) {
    throw new Error('Session not found');
  }

  const sessionId = session.id;

  /* 4️⃣ Generate new refresh token (rotate within the same session) */
  const newEchoRefreshTokenExpiry = createEchoRefreshTokenExpiry();

  // Deactivate old refresh token
  await archiveRefreshToken(refresh_token);

  const newEchoRefreshToken = await db.$transaction(async tx => {
    const [newEchoRefreshToken] = await Promise.all([
      await tx.refreshToken.create({
        data: {
          token: `refresh_${nanoid(48)}`,
          expiresAt: newEchoRefreshTokenExpiry,
          userId: user.id,
          echoAppId: echoApp.id,
          scope,
          sessionId,
        },
      }),
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

    return newEchoRefreshToken;
  });

  const { access_token, access_token_expiry } = await createEchoAccessJwt({
    userId: user.id,
    appId: echoApp.id,
    scope,
    sessionId,
  });

  return {
    access_token,
    token_type: 'Bearer',
    expires_in: differenceInSeconds(access_token_expiry, new Date()),
    refresh_token: newEchoRefreshToken.token,
    refresh_token_expires_in: differenceInSeconds(
      newEchoRefreshTokenExpiry,
      new Date()
    ),
    scope: echoRefreshTokenRecord.scope,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || '',
    },
    echo_app: {
      id: echoApp.id,
      name: echoApp.name,
      description: echoApp.description || '',
    },
  };
}

const archiveRefreshToken = async (refreshToken: string) => {
  await db.refreshToken.update({
    where: { token: refreshToken },
    data: { isArchived: true, archivedAt: new Date() },
  });
};

export const createEchoRefreshTokenExpiry = () => {
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
