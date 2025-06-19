import {
  handleRefreshToken,
  handleInitialTokenIssuance,
} from '@/lib/jwt-tokens';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    /* 1️⃣ Parse the token request - handle both JSON and form-encoded */
    let body: Record<string, string>;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      // Default to JSON
      body = await req.json();
    }

    const { grant_type, code, redirect_uri, client_id, code_verifier } = body;

    // Validate required parameters
    if (grant_type !== 'authorization_code' && grant_type !== 'refresh_token') {
      return NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code grant type is supported',
        },
        { status: 400 }
      );
    }

    if (grant_type === 'refresh_token') {
      const { refresh_token } = body;

      if (!refresh_token) {
        return NextResponse.json(
          {
            error: 'invalid_grant',
            error_description: 'Missing refresh token',
          },
          { status: 400 }
        );
      }

      const result = await handleRefreshToken(refresh_token);

      // Check if result is an error
      if ('error' in result) {
        return NextResponse.json(result, { status: 400 });
      }

      // Return successful refresh token response
      return NextResponse.json(result);
    }

    if (!code || !redirect_uri || !client_id || !code_verifier) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Missing required parameters',
        },
        { status: 400 }
      );
    }

    const result = await handleInitialTokenIssuance({
      code,
      redirect_uri,
      client_id,
      code_verifier,
    });

    // Check if result is an error
    if ('error' in result) {
      return NextResponse.json(result, { status: 400 });
    }

    // Return successful token response
    return NextResponse.json(result);
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        error_description: 'Internal server error during token exchange',
      },
      { status: 500 }
    );
  }
}
