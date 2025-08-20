import { EchoClient } from '@merit-systems/echo-typescript-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createEchoAnthropic } from 'providers/anthropic';
import {
  handleCallback,
  handleGetUser,
  handleSignIn,
} from './auth/oauth-handlers';
import {
  getEchoClient as _getEchoClient,
  getEchoToken as _getEchoToken,
} from './auth/token-manager';
import { createEchoOpenAI } from './providers/openai';
import { EchoConfig, EchoResult } from './types';
import { fetchEchoAction } from './utils/create-action-url';

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

      case '/user':
        return handleGetUser(req, config);

      default:
        return NextResponse.error();
    }
  };

  /**
   * Check if user is currently signed in
   */
  // const getEchoUser = async (): Promise<User> => {
  //   return getUser(config.appId);
  // };

  const getEchoClient = async (): Promise<EchoClient | null> => {
    return _getEchoClient(config.appId);
  };
  /**
   * Get a valid Echo token, refreshing if necessary
   */
  const getEchoToken = (): Promise<string | null> => {
    return _getEchoToken(config.appId);
  };

  /**
   * Get current user info with automatic token refresh
   */
  const getUser = async () => {
    const response = await fetchEchoAction('user', config);
    return response.ok ? await response.json() : null;
  };

  return {
    handlers: {
      GET: httpHandler,
      POST: httpHandler,
    },
    // echo auth
    getUser,
    getEchoClient,
    getEchoToken,
    // providers
    openai: createEchoOpenAI(config),
    anthropic: createEchoAnthropic(config),
  };
}
