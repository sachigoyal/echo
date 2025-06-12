import { db } from '@/lib/db';
import { createEchoAccessJwtToken } from '@/lib/jwt-tokens';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import {
  createEchoRefreshTokenExpiry,
  createEchoAccessTokenExpiry,
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
    const echoRefreshTokenRecord = await db.refreshToken.findUnique({
      where: {
        token: refresh_token,
        isActive: true,
      },
      include: {
        user: true,
        echoApp: true,
      },
    });

    if (!echoRefreshTokenRecord) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Invalid or expired refresh token',
        },
        { status: 400 }
      );
    }

    /* 2️⃣ Check if refresh token is expired */
    if (echoRefreshTokenRecord.expiresAt < new Date()) {
      // Deactivate expired token
      await db.refreshToken.update({
        where: { id: echoRefreshTokenRecord.id },
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
    if (!echoRefreshTokenRecord.echoApp.isActive) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Echo app is no longer active',
        },
        { status: 400 }
      );
    }

    /* 5️⃣ Generate new refresh token */
    const newEchoRefreshTokenValue = `refresh_${nanoid(48)}`;
    const newEchoRefreshTokenExpiry = createEchoRefreshTokenExpiry();

    // Deactivate old refresh token
    await db.refreshToken.update({
      where: { id: echoRefreshTokenRecord.id },
      data: { isActive: false },
    });

    // Create new refresh token
    const newEchoRefreshToken = await db.refreshToken.create({
      data: {
        token: newEchoRefreshTokenValue,
        expiresAt: newEchoRefreshTokenExpiry,
        userId: echoRefreshTokenRecord.userId,
        echoAppId: echoRefreshTokenRecord.echoAppId,
        scope: echoRefreshTokenRecord.scope,
        isActive: true,
      },
    });

    const newEchoAccessTokenExpiry = createEchoAccessTokenExpiry();

    /* 6️⃣ Generate new JWT access token */
    const echoAccessTokenJwtToken = await createEchoAccessJwtToken({
      userId: newEchoRefreshToken.userId,
      appId: newEchoRefreshToken.echoAppId,
      scope: echoRefreshTokenRecord.scope,
      keyVersion: 1,
      expiry: newEchoAccessTokenExpiry,
    });

    /* 7️⃣ Return new JWT token */
    return NextResponse.json({
      access_token: echoAccessTokenJwtToken, // JWT instead of raw API key
      token_type: 'Bearer',
      expires_in: newEchoAccessTokenExpiry.getTime() - Date.now(),
      refresh_token: newEchoRefreshToken.token,
      refresh_token_expires_in:
        newEchoRefreshTokenExpiry.getTime() - Date.now(),
      scope: echoRefreshTokenRecord.scope,
      user: {
        id: echoRefreshTokenRecord.user.id,
        email: echoRefreshTokenRecord.user.email,
        name: echoRefreshTokenRecord.user.name,
      },
      echo_app: {
        id: echoRefreshTokenRecord.echoApp.id,
        name: echoRefreshTokenRecord.echoApp.name,
        description: echoRefreshTokenRecord.echoApp.description,
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
