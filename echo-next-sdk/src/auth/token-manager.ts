import { EchoClient, User } from '@merit-systems/echo-typescript-sdk';
import { ECHO_BASE_URL } from 'config';
import { cookies as getCookies } from 'next/headers';
import { shouldRefreshToken } from './jwt-utils';

interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  echo_app: {
    id: string;
    name: string;
    description: string;
  };
}

/**
 * Refresh an access token using a refresh token
 * @param refreshToken - The refresh token to use
 * @param appId - The Echo app ID
 * @returns Promise resolving to the new token data
 */
export async function performTokenRefresh(
  refreshToken: string,
  appId: string
): Promise<RefreshTokenResponse> {
  return fetch(`${ECHO_BASE_URL}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appId,
    }),
  }).then(async r => {
    if (r.ok) {
      const tokenData = (await r.json()) as RefreshTokenResponse;
      return tokenData;
    }
    return Promise.reject(new Error(await r.text()));
  });
}

/**
 * Get a valid Echo token, refreshing if necessary
 * @param appId - The Echo app ID for token refresh
 * @returns Promise resolving to a valid access token or null if authentication failed
 */
export async function getEchoToken(appId: string): Promise<string | null> {
  const cookies = await getCookies();
  const accessToken = cookies.get('echo_access_token')?.value;

  // Check if token needs refresh
  if (!accessToken || shouldRefreshToken(accessToken)) {
    console.log(cookies);
    const refreshToken = cookies.get('echo_refresh_token')?.value;

    if (!refreshToken) {
      console.log('No refresh token found');
      return null;
    }

    try {
      const refreshResult = await performTokenRefresh(refreshToken, appId);

      // Set new tokens in cookies
      cookies.set('echo_access_token', refreshResult.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshResult.expires_in,
        path: '/',
      });

      cookies.set('echo_refresh_token', refreshResult.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      console.log('Token refreshed');
      return refreshResult.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  return accessToken;
}

export async function getUser(appId: string): Promise<User> {
  const echo = await getEchoClient(appId);
  if (!echo) {
    throw new Error('User not signed in');
  }
  return echo.users.getUserInfo();
}

export async function getEchoClient(appId: string): Promise<EchoClient | null> {
  const token = await getEchoToken(appId);
  if (!token) {
    return null;
  }
  return new EchoClient({
    baseUrl: ECHO_BASE_URL,
    apiKey: token,
  });
}
