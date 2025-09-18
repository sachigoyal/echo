import { db } from '@/lib/db';
import {
  createEchoAccessTokenExpiry,
  createEchoRefreshTokenExpiry,
} from '@/lib/oauth-config';
import { PermissionService } from '@/lib/permissions/service';
import { AppRole, MembershipStatus } from '@/lib/permissions/types';
import { createHash } from 'crypto';
import { jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { logger } from '@/logger';
import { env } from '@/env';
import { createEchoAccessJwt } from './create-jwt';
import { differenceInSeconds } from 'date-fns';
import z from 'zod';
import { TokenMetadata } from './types';

// JWT secret for verifying authorization codes (must match authorize endpoint)
const JWT_SECRET = new TextEncoder().encode(
  env.OAUTH_CODE_SIGNING_JWT_SECRET || 'your-secret-key-change-in-production'
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

const authCodePayloadSchema = z.object({
  clientId: z.uuid(),
  redirectUri: z.url(),
  codeChallenge: z.string(),
  codeChallengeMethod: z.string(),
  scope: z.string(),
  userId: z.string(),
  exp: z.number(),
  code: z.string(),
});

/**
 * Authorization code token request parameters
 */

export const handleTokenIssuanceSchema = z.object({
  redirect_uri: z.url('redirect_uri must be a valid URL'),
  client_id: z.uuid('client_id must be a valid UUID'),
  code: z.string(),
  code_verifier: z
    .string()
    .min(43, 'code_verifier must be at least 43 characters')
    .max(128, 'code_verifier must be at most 128 characters')
    .regex(/^[A-Za-z0-9_-]+$/, {
      message: 'code_verifier must be base64url encoded',
    }),
});

/**
 * Handle initial token issuance from authorization code
 */
export async function handleInitialTokenIssuance(
  params: z.infer<typeof handleTokenIssuanceSchema>,
  metadata?: TokenMetadata
) {
  const { code, redirect_uri, client_id, code_verifier } = params;

  logger.emit({
    severityText: 'INFO',
    body: 'Processing authorization code token request',
    attributes: {
      function: 'handleInitialTokenIssuance',
      client_id,
    },
  });

  /* 3️⃣ Verify and decode the authorization code JWT */
  let authData: AuthCodePayload;
  try {
    const { payload } = await jwtVerify(code, JWT_SECRET);
    authData = payload as unknown as AuthCodePayload;
  } catch {
    return {
      error: 'invalid_grant',
      error_description: 'Invalid or expired authorization code',
    };
  }

  /* 4️⃣ Validate the authorization code data */
  if (
    authData.clientId !== client_id ||
    authData.redirectUri !== redirect_uri
  ) {
    return {
      error: 'invalid_grant',
      error_description: 'Authorization code does not match request parameters',
    };
  }

  /* 5️⃣ Verify PKCE code challenge */
  const codeVerifierHash = createHash('sha256')
    .update(code_verifier)
    .digest('base64url');

  if (codeVerifierHash !== authData.codeChallenge) {
    return {
      error: 'invalid_grant',
      error_description: 'PKCE verification failed',
    };
  }

  /* 6️⃣ Get user and validate they exist */
  const user = await db.user.findUnique({
    where: { id: authData.userId },
  });

  if (!user) {
    return {
      error: 'invalid_grant',
      error_description: 'User not found',
    };
  }

  /* 7️⃣ Find and validate the Echo app (client) */
  const echoApp = await db.echoApp.findFirst({
    where: {
      id: client_id,
    },
  });

  if (!echoApp) {
    return {
      error: 'invalid_client',
      error_description: 'Invalid or inactive client_id',
    };
  }

  /* 8️⃣ Validate redirect_uri against authorized callback URLs */
  const isLocalhostUrl = redirect_uri.startsWith('http://localhost:');
  const redirectUriWithoutTrailingSlash = redirect_uri.replace(/\/$/, '');
  const isAuthorizedUrl =
    echoApp.authorizedCallbackUrls.includes(redirect_uri) ||
    echoApp.authorizedCallbackUrls.includes(redirectUriWithoutTrailingSlash);

  if (!isLocalhostUrl && !isAuthorizedUrl) {
    return {
      error: 'invalid_grant',
      error_description:
        'redirect_uri (' +
        redirectUriWithoutTrailingSlash +
        ') is not authorized for this app',
    };
  }

  /* 9️⃣ Ensure the user has access to this Echo app */
  let userRole = await PermissionService.getUserAppRole(user.id, echoApp.id);

  if (userRole === AppRole.PUBLIC) {
    try {
      logger.emit({
        severityText: 'INFO',
        body: 'Creating app membership for user',
        attributes: {
          userId: user.id,
          echoAppId: echoApp.id,
          function: 'handleInitialTokenIssuance',
        },
      });
      // User needs to join the app
      const appMembership = await db.appMembership.create({
        data: {
          userId: user.id,
          echoAppId: echoApp.id,
          status: MembershipStatus.ACTIVE,
          role: AppRole.CUSTOMER,
          totalSpent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      userRole = appMembership.role as AppRole;
    } catch (error) {
      console.error('Error creating app membership:', error);
      return {
        error: 'server_error',
        error_description: 'Error creating app membership',
      };
    }
  }

  if (
    !userRole ||
    ![AppRole.OWNER, AppRole.ADMIN, AppRole.CUSTOMER].includes(userRole)
  ) {
    return {
      error: 'invalid_grant',
      error_description: 'Client does not belong to the authenticated user',
    };
  }

  /* 🔟 Create an app session and refresh token */
  const appSession = await db.appSession.create({
    data: {
      userId: user.id,
      echoAppId: echoApp.id,
      deviceName,
      userAgent,
      ipAddress,
    },
  });

  const echoRefreshTokenValue = `refresh_${nanoid(48)}`;
  const echoRefreshTokenExpiry = createEchoRefreshTokenExpiry();

  const newEchoRefreshToken = await db.refreshToken.create({
    data: {
      token: echoRefreshTokenValue,
      expiresAt: echoRefreshTokenExpiry,
      userId: user.id,
      echoAppId: echoApp.id,
      scope: authData.scope,
      sessionId: appSession.id,
    },
  });

  const newEchoAccessTokenExpiry = createEchoAccessTokenExpiry();

  /* 1️⃣1️⃣ Generate JWT access token for fast validation */
  const { access_token, access_token_expiry } = await createEchoAccessJwt({
    userId: user.id,
    appId: echoApp.id,
    scope: authData.scope,
    sessionId: appSession.id,
  });

  logger.emit({
    severityText: 'INFO',
    body: 'JWT access token generated',
    attributes: {
      userId: user.id,
      echoAppId: echoApp.id,
      function: 'handleInitialTokenIssuance',
    },
  });

  /* 1️⃣2️⃣ Return the JWT access token response with refresh token */
  return {
    access_token,
    token_type: 'Bearer',
    expires_in: differenceInSeconds(access_token_expiry, new Date()),
    refresh_token: newEchoRefreshToken.token,
    refresh_token_expires_in: differenceInSeconds(
      newEchoRefreshToken.expiresAt,
      new Date()
    ),
    scope: authData.scope,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || '',
    },
    echo_app: {
      id: echoApp.id,
      name: echoApp.name,
      description: echoApp.description || '',
    },
  };
}
