import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';
import { User, ApiKey, EchoApp } from '@/generated/prisma';
import { NextRequest } from 'next/server';
import { hashApiKey } from './crypto';
import { authenticateEchoAccessJwtToken } from './jwt-tokens';

/**
 * Get the current user from Clerk
 * Should be used for endpoints coming from the merit-hosted echo client
 * @returns The current user
 */
export async function getCurrentUser(): Promise<User> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Get user from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error('Clerk user not found');
  }

  // Try to find existing user in our database
  let user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  // If user doesn't exist, create them
  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name:
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
          null,
        totalPaid: 0, // Initialize with zero paid amount
        totalSpent: 0, // Initialize with zero spent amount
      },
    });
  }

  return user;
}

/**
 * Get the current user from an Echo API key or Echo Access JWT
 * Should be used for API requests on the /v1 endpoint
 * @param request - The request object
 * @returns The current user, apiKey, and echoApp
 */
export async function getCurrentUserByApiKeyOrEchoJwt(
  request: NextRequest
): Promise<{
  user: User;
  apiKey: ApiKey;
  echoApp: EchoApp;
}> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader; // Remove 'Bearer ' prefix

  // Check if token is a JWT (has 3 parts separated by dots)
  const isJWT = token.split('.').length === 3;

  if (isJWT) {
    const { user, apiKey, echoApp } =
      await authenticateEchoAccessJwtToken(token);

    // Update last used timestamp and metadata for JWT tokens
    await updateApiKeyUsage(apiKey.id, request);

    return {
      user,
      apiKey,
      echoApp,
    };
  } else {
    // Handle traditional API key (existing logic)
    // Hash the provided API key for direct O(1) lookup
    const keyHash = hashApiKey(token);

    // Direct lookup by keyHash - O(1) operation!
    const apiKeyRecord = await db.apiKey.findUnique({
      where: {
        keyHash,
      },
      include: {
        user: true,
        echoApp: true,
      },
    });

    // Verify the API key is valid and all related entities are active
    if (
      !apiKeyRecord ||
      !apiKeyRecord.isActive ||
      apiKeyRecord.isArchived ||
      apiKeyRecord.user.isArchived ||
      apiKeyRecord.echoApp.isArchived ||
      !apiKeyRecord.echoApp.isActive
    ) {
      throw new Error('Invalid or inactive API key');
    }

    // Update last used timestamp and metadata
    await updateApiKeyUsage(apiKeyRecord.id, request);

    return {
      user: apiKeyRecord.user,
      apiKey: apiKeyRecord,
      echoApp: apiKeyRecord.echoApp,
    };
  }
}

export async function updateApiKeyUsage(
  apiKeyId: string,
  request: NextRequest
) {
  try {
    const metadata = {
      lastIp:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    };

    await db.apiKey.update({
      where: { id: apiKeyId },
      data: {
        lastUsed: new Date(),
        metadata,
      },
    });
  } catch (error) {
    // Don't fail the request if updating usage fails
    console.error('Failed to update API key usage:', error);
  }
}

// Shared authentication function that supports Echo API key or Echo Access JWT authentication
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // API key authentication
    const authResult = await getCurrentUserByApiKeyOrEchoJwt(request);
    return {
      user: authResult.user,
      echoApp: authResult.echoApp,
      isApiKeyAuth: true,
      apiKey: authResult.apiKey,
    };
  } else {
    // Clerk authentication
    const user = await getCurrentUser();
    return {
      user,
      echoApp: null,
      isApiKeyAuth: false,
      apiKey: null,
    };
  }
}

/**
 * Get authentication info from middleware headers (for v1 API routes)
 * This function extracts user info that was validated in middleware
 * without requiring database access, making it suitable for high-performance routes
 *
 * Note: This only works for JWT tokens. API keys still require database validation
 * in individual routes due to Edge Runtime limitations.
 */
export function getAuthFromMiddleware(request: NextRequest): {
  userId?: string;
  appId?: string;
  scope?: string;
  isFromMiddleware: boolean;
} {
  const userId = request.headers.get('x-echo-user-id');
  const appId = request.headers.get('x-echo-app-id');
  const scope = request.headers.get('x-echo-scope');

  return {
    userId: userId || undefined,
    appId: appId || undefined,
    scope: scope || undefined,
    isFromMiddleware: !!(userId && appId), // true if we have the essential data
  };
}

/**
 * Hybrid authentication function that first tries to use middleware-validated auth,
 * and falls back to full database authentication for API keys
 */
export async function getAuthenticatedUserHybrid(request: NextRequest) {
  // First, try to get auth info from middleware
  const middlewareAuth = getAuthFromMiddleware(request);

  if (middlewareAuth.isFromMiddleware) {
    // JWT was validated in middleware, we can trust this data
    // For complete user/app data, you'd still need database calls, but
    // this is sufficient for basic authorization checks
    return {
      userId: middlewareAuth.userId!,
      appId: middlewareAuth.appId!,
      scope: middlewareAuth.scope,
      source: 'middleware' as const,
      isApiKeyAuth: true, // JWT tokens are considered API key auth in this context
    };
  }

  // Fallback to full authentication (needed for API keys or when middleware doesn't handle it)
  const authResult = await getAuthenticatedUser(request);
  return {
    userId: authResult.user.id,
    appId: authResult.echoApp?.id,
    scope: authResult.apiKey?.scope,
    source: 'database' as const,
    isApiKeyAuth: authResult.isApiKeyAuth,
    user: authResult.user,
    echoApp: authResult.echoApp,
    apiKey: authResult.apiKey,
  };
}
