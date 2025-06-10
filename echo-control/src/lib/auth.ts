import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';
import { NextRequest } from 'next/server';

export async function getCurrentUser() {
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
      },
    });
  }

  return user;
}

export async function getCurrentUserByApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Find the API key in the database
  const apiKeyRecord = await db.apiKey.findFirst({
    where: {
      key: apiKey,
      isActive: true,
      isArchived: false, // Only allow authentication with non-archived API keys
      user: {
        isArchived: false, // Only allow authentication for non-archived users
      },
      echoApp: {
        isArchived: false, // Only allow authentication for non-archived echo apps
      },
    },
    include: {
      user: true,
      echoApp: true,
    },
  });

  if (!apiKeyRecord) {
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

async function updateApiKeyUsage(apiKeyId: string, request: NextRequest) {
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

// Helper function to validate API keys from external services (like echo-server)
export async function validateApiKey(apiKey: string): Promise<{
  userId: string;
  echoAppId: string;
  user: { id: string; email: string; name: string | null; clerkId: string };
  echoApp: {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
  };
} | null> {
  try {
    // Remove Bearer prefix if present
    const cleanApiKey = apiKey.replace('Bearer ', '');

    const apiKeyRecord = await db.apiKey.findFirst({
      where: {
        key: cleanApiKey,
        isActive: true,
        isArchived: false, // Only allow validation of non-archived API keys
        user: {
          isArchived: false, // Only allow validation for non-archived users
        },
        echoApp: {
          isArchived: false, // Only allow validation for non-archived echo apps
        },
      },
      include: {
        user: true,
        echoApp: true,
      },
    });

    if (
      !apiKeyRecord ||
      !apiKeyRecord.echoApp ||
      !apiKeyRecord.echoApp.isActive
    ) {
      return null;
    }

    return {
      userId: apiKeyRecord.userId,
      echoAppId: apiKeyRecord.echoAppId,
      user: apiKeyRecord.user,
      echoApp: apiKeyRecord.echoApp,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Authentication required');
  }

  return userId;
}

// Shared authentication function that supports both Clerk and API key authentication
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // API key authentication
    const authResult = await getCurrentUserByApiKey(request);
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

// Shared authentication function that requires API key authentication only
export async function getAuthenticatedUserByApiKeyOnly(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  // API key authentication required for this endpoint
  const authResult = await getCurrentUserByApiKey(request);
  return {
    user: authResult.user,
    echoApp: authResult.echoApp,
    apiKey: authResult.apiKey,
  };
}
