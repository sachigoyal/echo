import { ApiKey, EchoApp, User } from '@/generated/prisma';
import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { db } from './db';

// JWT secret for API tokens (different from OAuth codes)
const API_JWT_SECRET = new TextEncoder().encode(
  process.env.API_JWT_SECRET || 'api-jwt-secret-change-in-production'
);

export interface ApiTokenPayload {
  user_id: string;
  app_id: string;
  scope: string;
  key_version: number;
  api_key_id: string;
  // Standard JWT claims
  sub: string; // user_id
  aud: string; // app_id
  exp: number;
  iat: number;
  jti: string; // unique token ID
}

/**
 * Create a JWT-based Echo Access Token for fast validation
 */
export async function createEchoAccessJwtToken(params: {
  userId: string;
  appId: string;
  scope: string;
  expiry: Date;
  keyVersion?: number;
}): Promise<string> {
  const { userId, appId, scope, expiry, keyVersion = 1 } = params;

  const tokenId = nanoid(16);
  const now = Math.floor(Date.now() / 1000); // divide by 1000 to convert to seconds
  const expirySeconds = Math.floor(expiry.getTime() / 1000); // divide by 1000 to convert to seconds

  const token = await new SignJWT({
    user_id: userId,
    app_id: appId,
    scope,
    key_version: keyVersion,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience(appId)
    .setJti(tokenId)
    .setIssuedAt(now)
    // set expiration time to the expiry time of the access token
    .setExpirationTime(expirySeconds)
    .sign(API_JWT_SECRET);

  return token;
}

/**
 * Verify and decode JWT API token (fast path - no DB lookup)
 */
export async function verifyEchoAccessJwtToken(
  token: string
): Promise<ApiTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, API_JWT_SECRET, {
      clockTolerance: 5, // 5 seconds clock skew tolerance
    });

    // Type assertion with validation
    const apiPayload = payload as unknown as ApiTokenPayload;

    // Validate required fields
    if (!apiPayload.user_id || !apiPayload.app_id || !apiPayload.scope) {
      return null;
    }

    return apiPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract user/app info from JWT without DB lookup
 */
export function extractTokenInfo(payload: ApiTokenPayload) {
  return {
    userId: payload.user_id,
    appId: payload.app_id,
    scope: payload.scope,
    keyVersion: payload.key_version,
    apiKeyId: payload.api_key_id,
    tokenId: payload.jti,
    issuedAt: new Date(payload.iat * 1000),
    expiresAt: new Date(payload.exp * 1000),
  };
}

/**
 * Check if token needs refresh (within 2 hours of expiry)
 */
export function shouldRefreshEchoAccessJwtToken(
  payload: ApiTokenPayload
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - now;
  return timeUntilExpiry < 2 * 60 * 60; // 2 hours
}

/**
 * Fast validation for Echo Server (hot path)
 */
export async function validateEchoAccessJwtTokenFast(
  authHeader: string
): Promise<{
  valid: boolean;
  userId?: string;
  appId?: string;
  scope?: string;
  error?: string;
}> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Invalid authorization header' };
  }

  const token = authHeader.substring(7);
  const payload = await verifyEchoAccessJwtToken(token);

  if (!payload) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  return {
    valid: true,
    userId: payload.user_id,
    appId: payload.app_id,
    scope: payload.scope,
  };
}

export async function authenticateEchoAccessJwtToken(
  jwtToken: string
): Promise<{
  user: User;
  apiKey: ApiKey;
  echoApp: EchoApp;
}> {
  const jwtPayload = await verifyEchoAccessJwtToken(jwtToken);

  console.log('🔍 DEBUG: jwtPayload', jwtPayload);

  if (!jwtPayload) {
    throw new Error('Invalid or expired JWT token');
  }

  if (jwtPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT token has expired');
  }

  // Get user from database using the JWT payload
  const user = await db.user.findUnique({
    where: { id: jwtPayload.user_id },
  });

  if (!user || user.isArchived) {
    throw new Error('User not found or archived');
  }

  // Get echo app from database
  const echoApp = await db.echoApp.findUnique({
    where: { id: jwtPayload.app_id },
  });

  if (!echoApp || echoApp.isArchived || !echoApp.isActive) {
    throw new Error('Echo app not found, archived, or inactive');
  }

  // Find API key by api_key_id
  const apiKey = await db.apiKey.findUnique({
    where: { id: jwtPayload.api_key_id },
  });

  if (!apiKey || !apiKey.isActive || apiKey.isArchived) {
    throw new Error('API key not found, inactive, or archived');
  }

  // Verify the API key belongs to the correct user and app from JWT
  if (
    apiKey.userId !== jwtPayload.user_id ||
    apiKey.echoAppId !== jwtPayload.app_id
  ) {
    throw new Error('API key does not match JWT user/app');
  }

  return {
    user,
    apiKey,
    echoApp,
  };
}
