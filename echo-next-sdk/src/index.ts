import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { ECHO_BASE_URL, EchoClient } from '@merit-systems/echo-typescript-sdk';
import { EchoConfig, EchoResult } from './types';

import { createEchoAnthropic } from 'providers/anthropic';
import { createEchoGoogle } from 'providers/google';
import { createEchoOpenAI } from 'providers/openai';

import {
  handleCallback,
  handleRefresh,
  handleSignIn,
} from './auth/oauth-handlers';

/**
 * Echo SDK for Next.js
 * Provides OAuth authentication and token management for Echo API integration
 */
export default function Echo(config: EchoConfig): EchoResult {
  /**
   * HTTP handler for OAuth routes (signin and callback)
   */
  const httpHandler = async (req: NextRequest): Promise<Response> => {
    const { pathname } = req.nextUrl;
    const basePath = config.basePath || '/api/echo';
    const path = pathname.replace(basePath, '');

    switch (path) {
      case '/signin':
        return handleSignIn(req, config);

      case '/callback':
        return handleCallback(req, config);

      case '/refresh':
        return handleRefresh(req, config);

      default:
        return NextResponse.error();
    }
  };

  /**
   * Get current user info with automatic token refresh
   */
  const getUser = async () => {
    // read only access token, if expired we are fucked
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('echo_access_token')?.value;
    if (!accessToken) {
      return null;
    }
    const echo = new EchoClient({
      apiKey: accessToken,
      baseUrl: ECHO_BASE_URL,
    });
    const user = await echo.users.getUserInfo();
    return user;
  };

  const isSignedIn = async () => {
    const cookieStore = await cookies();
    const refreshTokenExpiry = cookieStore.get(
      'echo_refresh_token_expires'
    )?.value;

    if (!refreshTokenExpiry) {
      return false; // No expiry stored
    }

    const expiryTime = parseInt(refreshTokenExpiry);
    const now = Math.floor(Date.now() / 1000);

    return expiryTime > now; // True if not expired
  };

  return {
    // http handlers
    handlers: {
      GET: httpHandler,
      POST: httpHandler,
    },

    // echo auth
    getUser,
    isSignedIn,

    // providers
    openai: createEchoOpenAI(config),
    anthropic: createEchoAnthropic(config),
    google: createEchoGoogle(config),
  };
}
