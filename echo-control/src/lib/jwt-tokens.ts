import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

// JWT secret for API tokens (different from OAuth codes)
const API_JWT_SECRET = new TextEncoder().encode(
  process.env.API_JWT_SECRET || 'api-jwt-secret-change-in-production'
);

// JWT expiry time (shorter for security)
const API_JWT_EXPIRY = 60 * 60 * 24; // 24 hours

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
 * Create a JWT-based API token for fast validation
 */
export async function createApiToken(params: {
  userId: string;
  appId: string;
  apiKeyId: string;
  scope: string;
  keyVersion?: number;
}): Promise<string> {
  const { userId, appId, apiKeyId, scope, keyVersion = 1 } = params;

  const tokenId = nanoid(16);
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    user_id: userId,
    app_id: appId,
    scope,
    key_version: keyVersion,
    api_key_id: apiKeyId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience(appId)
    .setJti(tokenId)
    .setIssuedAt(now)
    .setExpirationTime(now + API_JWT_EXPIRY)
    .sign(API_JWT_SECRET);

  return token;
}

/**
 * Verify and decode JWT API token (fast path - no DB lookup)
 */
export async function verifyApiToken(
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
export function shouldRefreshToken(payload: ApiTokenPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = payload.exp - now;
  return timeUntilExpiry < 2 * 60 * 60; // 2 hours
}

/**
 * Fast validation for Echo Server (hot path)
 */
export async function validateApiTokenFast(authHeader: string): Promise<{
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
  const payload = await verifyApiToken(token);

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
