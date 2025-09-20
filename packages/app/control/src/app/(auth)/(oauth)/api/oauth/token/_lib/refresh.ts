import z from 'zod';

import { tokenResponse } from './response';

import { logger } from '@/logger';

import { createEchoAccessJwt } from '@/lib/access-token';

import type { TokenMetadata } from './types';
import { oauthValidationError } from '@/app/(auth)/(oauth)/_lib/oauth-route';
import {
  OAuthError,
  OAuthErrorType,
} from '@/app/(auth)/(oauth)/_lib/oauth-error';
import {
  archiveRefreshToken,
  createRefreshToken,
  findRefreshToken,
} from '@/services/db/ops/auth/refresh';
import { updateAppSession } from '@/services/db/ops/auth/session';

export const handleRefreshTokenSchema = z.object({
  refresh_token: z.string({
    error: oauthValidationError({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'refresh_token must be a string',
    }),
  }),
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

  const refreshToken = await findRefreshToken(token);

  if (!refreshToken) {
    throw new OAuthError({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'Refresh token not found',
    });
  }

  if (refreshToken.expiresAt < new Date()) {
    // Deactivate expired token
    await archiveRefreshToken(token);
    throw new OAuthError({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'Refresh token expired',
    });
  }

  if (refreshToken.archivedAt) {
    console.warn('🔄 Allowed a refresh for archived token within grace period');
  }

  const { user, echoApp: app, session, scope } = refreshToken;

  if (!session) {
    throw new OAuthError({
      error: OAuthErrorType.INVALID_REQUEST,
      error_description: 'Session not found',
    });
  }

  const sessionId = session.id;

  // Deactivate old refresh token

  const [newRefreshToken, updatedSession] = await Promise.all([
    createRefreshToken({
      userId: user.id,
      echoAppId: app.id,
      scope,
      sessionId,
    }),
    updateAppSession({
      sessionId,
      metadata,
    }),
    archiveRefreshToken(token),
  ]);

  const accessToken = await createEchoAccessJwt({
    user_id: user.id,
    app_id: app.id,
    session_id: updatedSession.id,
    scope,
  });

  return tokenResponse({
    user,
    app,
    accessToken,
    refreshToken: newRefreshToken,
  });
}
