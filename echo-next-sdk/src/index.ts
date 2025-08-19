import { NextRequest, NextResponse } from 'next/server';
import { EchoConfig, EchoResult } from './types';
import { cookies as getCookies } from 'next/headers';

const echoApiUrl = 'https://echo.merit.systems';

const generateCodeChallenge = async () => {
  const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const encoder = new TextEncoder();
  const codeChallengeBuffer = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(codeVerifier)
  );
  const codeChallenge = btoa(
    String.fromCharCode(...new Uint8Array(codeChallengeBuffer))
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { codeVerifier, codeChallenge };
};

export default function Echo(config: EchoConfig): EchoResult {
  const httpHandler = async (req: NextRequest) => {
    const { pathname, origin } = req.nextUrl;

    const basePath = config.basePath || '/api/echo';

    const path = pathname.replace(basePath, '');

    if (path === '/signin') {
      const redirectUrl = new URL(`${echoApiUrl}/api/oauth/authorize`);
      redirectUrl.searchParams.set('client_id', config.appId);
      redirectUrl.searchParams.set(
        'redirect_uri',
        `${origin}${basePath}/callback`
      );
      redirectUrl.searchParams.set('response_type', 'code');

      const { codeVerifier, codeChallenge } = await generateCodeChallenge();

      redirectUrl.searchParams.set('code_challenge', codeChallenge);
      redirectUrl.searchParams.set('code_challenge_method', 'S256');

      // Create response with redirect and set cookie for code verifier
      const response = NextResponse.redirect(redirectUrl.toString());

      // Set the code verifier in a secure cookie that will be available during callback
      response.cookies.set('echo_code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300, // 5 minutes - same as auth code TTL
        path: '/',
      });

      return response;
    }

    if (path === '/callback') {
      const code = req.nextUrl.searchParams.get('code');
      const state = req.nextUrl.searchParams.get('state');

      if (!code || !state) {
        return new Response('Invalid request', { status: 400 });
      }

      // Retrieve the code verifier from the cookie
      const codeVerifier = req.cookies.get('echo_code_verifier')?.value;

      if (!codeVerifier) {
        return new Response(
          'Code verifier not found. Please try signing in again.',
          { status: 400 }
        );
      }

      // Exchange the code for a token from the token endpoint
      const tokenEndpoint = `${echoApiUrl}/api/oauth/token`;

      const params = new URLSearchParams();
      params.set('grant_type', 'authorization_code');
      params.set('code', code);
      params.set('redirect_uri', `${origin}${basePath}/callback`);
      params.set('client_id', config.appId);
      params.set('code_verifier', codeVerifier);

      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!tokenResponse.ok) {
        return new Response('Token exchange failed', { status: 500 });
      }

      const tokenData = await tokenResponse.json();

      const response = NextResponse.redirect(`${origin}`);

      // Clear the code verifier cookie after successful token exchange
      response.cookies.set('echo_code_verifier', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
        path: '/',
      });

      // Set the access token as a cookie
      response.cookies.set('echo_access_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in, // expires_in is typically in seconds
        path: '/',
      });

      response.cookies.set('echo_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // You may want to set a longer expiry for refresh tokens, adjust as needed
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/api/echo',
      });

      return response;
    }

    return NextResponse.error();
  };

  const isSignedIn = async () => {
    const cookies = await getCookies();
    const accessToken = cookies.get('echo_access_token')?.value;
    return !!accessToken;
  };

  return {
    handlers: {
      GET: httpHandler,
      POST: httpHandler,
    },
    isSignedIn,
  };
}
