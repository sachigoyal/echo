import { db } from '@/lib/db';
import { createApiToken } from '@/lib/jwt-tokens';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { hashApiKey } from '@/lib/crypto';
import {
  createRefreshTokenExpiry,
  createAccessTokenExpiry,
} from '@/lib/oauth-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grant_type, refresh_token } = body;

    // Validate grant type
    if (grant_type !== 'refresh_token') {
      return NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only refresh_token grant type is supported',
        },
        { status: 400 }
      );
    }

    if (!refresh_token) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Missing refresh_token parameter',
        },
        { status: 400 }
      );
    }

    /* 1️⃣ Find and validate refresh token */
    const refreshTokenRecord = await db.refreshToken.findUnique({
      where: {
        token: refresh_token,
        isActive: true,
      },
      include: {
        user: true,
        echoApp: true,
        apiKey: true,
      },
    });

    if (!refreshTokenRecord) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid or expired refresh token',
        },
        { status: 400 }
      );
    }

    /* 2️⃣ Check if refresh token is expired */
    if (refreshTokenRecord.expiresAt < new Date()) {
      // Deactivate expired token
      await db.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { isActive: false },
      });

      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Refresh token has expired',
        },
        { status: 400 }
      );
    }

    /* 3️⃣ Check if echo app is still active */
    if (!refreshTokenRecord.echoApp.isActive) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Echo app is no longer active',
        },
        { status: 400 }
      );
    }

    /* 4️⃣ Generate new API key (rotate the access token) */
    const newKeyValue = `echo_${nanoid(40)}`;
    const keyHash = hashApiKey(newKeyValue);

    // Deactivate old API key
    await db.apiKey.update({
      where: { id: refreshTokenRecord.apiKeyId },
      data: { isActive: false },
    });

    // Create new API key
    const newApiKey = await db.apiKey.create({
      data: {
        keyHash,
        name: 'OAuth Generated (Refreshed)',
        userId: refreshTokenRecord.userId,
        echoAppId: refreshTokenRecord.echoAppId,
        isActive: true,
        metadata: {
          createdVia: 'oauth_refresh',
          scope: refreshTokenRecord.scope,
          refreshedAt: new Date().toISOString(),
          previousApiKeyId: refreshTokenRecord.apiKeyId,
        },
      },
    });

    /* 5️⃣ Generate new refresh token */
    const newRefreshTokenValue = `refresh_${nanoid(48)}`;
    const newRefreshTokenExpiry = createRefreshTokenExpiry();

    // Deactivate old refresh token
    await db.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { isActive: false },
    });

    // Create new refresh token
    const newRefreshToken = await db.refreshToken.create({
      data: {
        token: newRefreshTokenValue,
        expiresAt: newRefreshTokenExpiry,
        userId: refreshTokenRecord.userId,
        echoAppId: refreshTokenRecord.echoAppId,
        apiKeyId: newApiKey.id,
        scope: refreshTokenRecord.scope,
        isActive: true,
      },
    });

    const accessTokenExpiry = createAccessTokenExpiry();

    /* 6️⃣ Generate new JWT access token */
    const jwtToken = await createApiToken({
      userId: refreshTokenRecord.userId,
      appId: refreshTokenRecord.echoAppId,
      apiKeyId: newApiKey.id,
      scope: refreshTokenRecord.scope,
      keyVersion: 1,
      expiry: accessTokenExpiry,
    });

    /* 7️⃣ Return new JWT token */
    return NextResponse.json({
      access_token: jwtToken, // JWT instead of raw API key
      token_type: 'Bearer',
      expires_in: accessTokenExpiry.getTime() - Date.now(),
      refresh_token: newRefreshToken.token,
      refresh_token_expires_in: newRefreshTokenExpiry.getTime() - Date.now(),
      scope: refreshTokenRecord.scope,
      user: {
        id: refreshTokenRecord.user.id,
        email: refreshTokenRecord.user.email,
        name: refreshTokenRecord.user.name,
      },
      echo_app: {
        id: refreshTokenRecord.echoApp.id,
        name: refreshTokenRecord.echoApp.name,
        description: refreshTokenRecord.echoApp.description,
      },
      _internal: {
        api_key_id: newApiKey.id,
        // Note: Original key is not stored in plaintext for security
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      {
        error: 'server_error',
        error_description: 'Internal server error during token refresh',
      },
      { status: 500 }
    );
  }
}
