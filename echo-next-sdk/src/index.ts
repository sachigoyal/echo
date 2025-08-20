import { NextRequest, NextResponse } from 'next/server';
import { handleCallback, handleSignIn } from './auth/oauth-handlers';
import {
  isSignedIn as checkSignedIn,
  getEchoToken as getToken,
} from './auth/token-manager';
import { EchoConfig, EchoResult } from './types';

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

      default:
        return NextResponse.error();
    }
  };

  /**
   * Check if user is currently signed in
   */
  const isSignedIn = (): Promise<boolean> => {
    return checkSignedIn();
  };

  /**
   * Get a valid Echo token, refreshing if necessary
   */
  const getEchoToken = (): Promise<string | null> => {
    return getToken(config.appId);
  };

  return {
    handlers: {
      GET: httpHandler,
      POST: httpHandler,
    },
    isSignedIn,
    getEchoToken,
    baseUrl: 'https://echo.router.merit.systems',
  };
}
