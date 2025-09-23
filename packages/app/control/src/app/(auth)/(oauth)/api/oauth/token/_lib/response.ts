import { differenceInSeconds } from 'date-fns';

import type { createEchoAccessJwt } from '@/lib/access-token';

import type { createRefreshToken } from '@/services/db/auth/refresh';

interface TokenResponseParams {
  accessToken: Awaited<ReturnType<typeof createEchoAccessJwt>>;
  refreshToken: Awaited<ReturnType<typeof createRefreshToken>>;
}

export const tokenResponse = ({
  accessToken,
  refreshToken,
}: TokenResponseParams) => ({
  access_token: accessToken.access_token,
  token_type: 'Bearer',
  expires_in: differenceInSeconds(accessToken.access_token_expiry, new Date()),
  refresh_token: refreshToken.token,
  refresh_token_expires_in: differenceInSeconds(
    refreshToken.expiresAt,
    new Date()
  ),
  scope: accessToken.scope,
  user: {
    id: refreshToken.user.id,
    email: refreshToken.user.email,
    name: refreshToken.user.name ?? '',
  },
  echo_app: {
    id: refreshToken.echoApp.id,
    name: refreshToken.echoApp.name,
    description: refreshToken.echoApp.description ?? '',
  },
});
