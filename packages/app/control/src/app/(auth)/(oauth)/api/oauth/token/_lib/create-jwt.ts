import z from 'zod';

import { SignJWT } from 'jose';

import { nanoid } from 'nanoid';

import { addSeconds, getUnixTime } from 'date-fns';

import { env } from '@/env';
import { logger } from '@/logger';
import { Prisma } from '@/generated/prisma';

const API_ECHO_ACCESS_JWT_SECRET = new TextEncoder().encode(
  env.API_ECHO_ACCESS_JWT_SECRET
);

const jwtPayloadSchema = z.object({
  userId: z.uuid(),
  appId: z.uuid(),
  scope: z.string(),
  keyVersion: z.number().optional().default(1),
  sessionId: z.string().optional(),
});

/**
 * Create a JWT-based Echo Access Token for fast validation
 *
 * Throws an error if the params are invalid
 */
export const createEchoAccessJwt = async (
  params: z.input<typeof jwtPayloadSchema>
) => {
  const { userId, appId, scope, keyVersion, sessionId } =
    jwtPayloadSchema.parse(params);

  const tokenId = nanoid(16);

  const expiry = createEchoAccessJwtExpiry();

  const now = getUnixTime(new Date());
  const expirySeconds = getUnixTime(expiry);

  const access_token = await new SignJWT({
    user_id: userId,
    app_id: appId,
    scope,
    key_version: keyVersion,
    ...(sessionId ? { sid: sessionId } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience(appId)
    .setJti(tokenId)
    .setIssuedAt(now)
    .setExpirationTime(expirySeconds)
    .sign(API_ECHO_ACCESS_JWT_SECRET);

  return {
    access_token,
    scope,
    access_token_expiry: expiry,
  };
};

const createEchoAccessJwtExpiry = (): Date => {
  const expiry = addSeconds(new Date(), env.OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS);
  logger.emit({
    severityText: 'DEBUG',
    body: 'Echo access token expiry calculated',
    attributes: {
      expiryTime: expiry.toISOString(),
      function: 'createEchoAccessTokenExpiry',
    },
  });
  return expiry;
};
