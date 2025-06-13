import { db } from '@/lib/db';
import { createEchoAccessJwtToken } from '@/lib/jwt-tokens';
import { createHash } from 'crypto';
import { jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { PermissionService } from '@/lib/permissions/service';
import { AppRole } from '@/lib/permissions/types';
import {
  createEchoAccessTokenExpiry,
  createEchoRefreshTokenExpiry,
} from '@/lib/oauth-config';

// JWT secret for verifying authorization codes (must match authorize endpoint)
const JWT_SECRET = new TextEncoder().encode(
  process.env.OAUTH_JWT_SECRET || 'your-secret-key-change-in-production'
);

interface AuthCodePayload {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  userId: string;
  exp: number;
  code: string;
}

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
    if (grant_type !== 'authorization_code') {
      return NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code grant type is supported',
        },
        { status: 400 }
      );
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

    // Validate code verifier length (RFC 7636 Section 4.1)
    // Must be 43-128 characters
    if (code_verifier.length < 43 || code_verifier.length > 128) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'code_verifier must be 43-128 characters long',
        },
        { status: 400 }
      );
    }

    // Validate code verifier format (only unreserved characters)
    if (!/^[A-Za-z0-9._~-]+$/.test(code_verifier)) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'code_verifier contains invalid characters',
        },
        { status: 400 }
      );
    }

    /* 2️⃣ Verify and decode the authorization code JWT */
    let authData: AuthCodePayload;
    try {
      const { payload } = await jwtVerify(code, JWT_SECRET);
      authData = payload as unknown as AuthCodePayload;
    } catch {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid or expired authorization code',
        },
        { status: 400 }
      );
    }

    /* 3️⃣ Validate the authorization code data */
    if (
      authData.clientId !== client_id ||
      authData.redirectUri !== redirect_uri
    ) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description:
            'Authorization code does not match request parameters',
        },
        { status: 400 }
      );
    }

    /* 4️⃣ Verify PKCE code challenge */
    const codeVerifierHash = createHash('sha256')
      .update(code_verifier)
      .digest('base64url');

    if (codeVerifierHash !== authData.codeChallenge) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'PKCE verification failed',
        },
        { status: 400 }
      );
    }

    /* 5️⃣ Get user and validate they exist */
    const user = await db.user.findUnique({
      where: { clerkId: authData.userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'User not found',
        },
        { status: 400 }
      );
    }

    /* 6️⃣ Find and validate the Echo app (client) */
    const echoApp = await db.echoApp.findFirst({
      where: {
        id: client_id,
        isActive: true,
      },
    });

    if (!echoApp) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'Invalid or inactive client_id',
        },
        { status: 400 }
      );
    }

    // Validate redirect_uri against authorized callback URLs
    if (!echoApp.authorizedCallbackUrls.includes(redirect_uri)) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'redirect_uri is not authorized for this client',
        },
        { status: 400 }
      );
    }

    // Ensure the user has access to this Echo app (from the authorization code)
    const userRole = await PermissionService.getUserAppRole(
      user.id,
      echoApp.id
    );
    if (
      !userRole ||
      ![AppRole.OWNER, AppRole.ADMIN, AppRole.CUSTOMER].includes(userRole)
    ) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Client does not belong to the authenticated user',
        },
        { status: 400 }
      );
    }

    /* 8️⃣ Generate refresh token */
    const echoRefreshTokenValue = `refresh_${nanoid(48)}`;
    const echoRefreshTokenExpiry = createEchoRefreshTokenExpiry();

    // Deactivate any existing refresh tokens for this app
    await db.refreshToken.updateMany({
      where: {
        userId: user.id,
        echoAppId: echoApp.id,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Create new refresh token
    const newEchoRefreshToken = await db.refreshToken.create({
      data: {
        token: echoRefreshTokenValue,
        expiresAt: echoRefreshTokenExpiry,
        userId: user.id,
        echoAppId: echoApp.id,
        scope: authData.scope,
        isActive: true,
      },
    });

    const newEchoAccessTokenExpiry = createEchoAccessTokenExpiry();

    /* 9️⃣ Generate JWT access token for fast validation */
    const echoAccessTokenJwtToken = await createEchoAccessJwtToken({
      userId: user.id,
      appId: echoApp.id,
      scope: authData.scope,
      keyVersion: 1, // Can be incremented to invalidate old tokens
      expiry: newEchoAccessTokenExpiry,
    });

    /* 🔟 Return the JWT access token response with refresh token */
    const response = NextResponse.json({
      access_token: echoAccessTokenJwtToken, // JWT instead of raw API key
      token_type: 'Bearer',
      expires_in: newEchoAccessTokenExpiry.getTime() - Date.now(),
      refresh_token: newEchoRefreshToken.token,
      refresh_token_expires_in:
        newEchoRefreshToken.expiresAt.getTime() - Date.now(),
      scope: authData.scope,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      echo_app: {
        id: echoApp.id,
        name: echoApp.name,
        description: echoApp.description,
      },
    });

    return response;
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
