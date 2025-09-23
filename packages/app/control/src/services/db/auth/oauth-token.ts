import { db } from '../client';

import { createAppSession, updateAppSession } from './session';
import { createRefreshToken, archiveRefreshToken } from './refresh';

import type { TokenMetadata } from '@/types/token-metadata';

interface IssueOAuthTokenParams {
  userId: string;
  appId: string;
  scope: string;
  metadata?: TokenMetadata;
}

export const issueOAuthToken = async ({
  userId,
  appId,
  scope,
  metadata,
}: IssueOAuthTokenParams) => {
  return await db.$transaction(async tx => {
    const session = await createAppSession(
      {
        userId: userId,
        appId: appId,
        metadata,
      },
      tx
    );

    const refreshToken = await createRefreshToken(
      {
        userId: userId,
        echoAppId: appId,
        scope,
        sessionId: session.id,
      },
      tx
    );

    return {
      session,
      refreshToken,
    };
  });
};

interface RefreshOAuthTokenParams {
  userId: string;
  appId: string;
  scope: string;
  metadata?: TokenMetadata;
  sessionId: string;
  token: string;
}

export const refreshOAuthToken = async ({
  userId,
  appId,
  scope,
  metadata,
  sessionId,
  token,
}: RefreshOAuthTokenParams) => {
  return await db.$transaction(async tx => {
    const [newRefreshToken, updatedSession] = await Promise.all([
      createRefreshToken(
        {
          userId,
          echoAppId: appId,
          scope,
          sessionId,
        },
        tx
      ),
      updateAppSession(
        {
          sessionId,
          metadata,
        },
        tx
      ),
      archiveRefreshToken(token, tx),
    ]);

    return {
      newRefreshToken,
      updatedSession,
    };
  });
};
