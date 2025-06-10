import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PermissionService } from '@/lib/permissions/service';
import { AppRole, Permission } from '@/lib/permissions/types';
import { hashApiKey, generateApiKey } from '@/lib/crypto';

// GET /api/api-keys - List API keys user has access to
export async function GET() {
  try {
    const user = await getCurrentUser();

    // Get all API keys user has access to
    const accessibleApps = await PermissionService.getAccessibleApps(user.id);
    const appIds = accessibleApps.map(({ app }) => app.id);

    const apiKeys = await db.apiKey.findMany({
      where: {
        echoAppId: { in: appIds },
        isArchived: false,
        echoApp: {
          isArchived: false,
        },
      },
      include: {
        echoApp: true,
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter keys based on permissions
    const filteredKeys = apiKeys.filter(key => {
      const appAccess = accessibleApps.find(
        ({ app }) => app.id === key.echoAppId
      );
      if (!appAccess) return false;

      // Owners can see all keys for their apps
      if (appAccess.userRole === AppRole.OWNER) return true;

      // Customers can only see their own keys
      if (appAccess.userRole === AppRole.CUSTOMER) {
        return key.userId === user.id;
      }

      // Admins can see all keys
      if (appAccess.userRole === AppRole.ADMIN) return true;

      return false;
    });

    return NextResponse.json({ apiKeys: filteredKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/api-keys - Create a new API key for authenticated user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { echoAppId, name } = body;

    if (!echoAppId) {
      return NextResponse.json(
        { error: 'Echo App ID is required' },
        { status: 400 }
      );
    }

    // Check permissions using the new permission system
    const hasCreatePermission = await PermissionService.hasPermission(
      user.id,
      echoAppId,
      Permission.CREATE_API_KEYS
    );

    const hasManageOwnPermission = await PermissionService.hasPermission(
      user.id,
      echoAppId,
      Permission.MANAGE_OWN_API_KEYS
    );

    if (!hasCreatePermission && !hasManageOwnPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const userRole = await PermissionService.getUserAppRole(user.id, echoAppId);
    const scope =
      userRole === AppRole.OWNER || userRole === AppRole.ADMIN
        ? 'owner'
        : 'customer';

    // Generate a new API key
    const generatedKey = generateApiKey();

    // Hash the API key for secure storage (deterministic for O(1) lookup)
    const keyHash = hashApiKey(generatedKey);

    // Create the API key
    const apiKey = await db.apiKey.create({
      data: {
        keyHash,
        name: name || 'API Key',
        userId: user.id,
        echoAppId,
        scope,
      },
      include: {
        echoApp: true,
      },
    });

    // Return the API key with the original plaintext key for the user to save
    const response = {
      ...apiKey,
      key: generatedKey, // Include the plaintext key in the response for the user to copy
    };

    return NextResponse.json({ apiKey: response }, { status: 201 });
  } catch (error) {
    console.error('Error creating API key:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
