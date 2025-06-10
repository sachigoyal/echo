import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PermissionService } from '@/lib/permissions/service';
import { Permission } from '@/lib/permissions/types';
import { randomBytes, randomUUID } from 'crypto';

// Generate a secure API key using UUID v4 and additional entropy
function generateApiKey(): string {
  const prefix = process.env.API_KEY_PREFIX || 'echo_';

  // Use UUID v4 for structured randomness
  const uuidPart = randomUUID().replace(/-/g, '');

  // Add additional cryptographic entropy (16 bytes = 32 hex chars)
  const entropyPart = randomBytes(16).toString('hex');

  // Combine for maximum security: prefix + UUID + entropy
  return `${prefix}${uuidPart}${entropyPart}`;
}

// GET /api/customer/apps/[id]/api-keys - List customer's own API keys
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const user = await getCurrentUser();

    // Check if user has permission to manage their own API keys for this app
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.MANAGE_OWN_API_KEYS
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const apiKeys = await db.apiKey.findMany({
      where: {
        echoAppId: appId,
        userId: user.id,
        createdByUserId: user.id,
        scope: 'customer',
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        createdAt: true,
        lastUsed: true,
      },
    });

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error fetching customer API keys:', error);

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

// POST /api/customer/apps/[id]/api-keys - Create customer API key
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const user = await getCurrentUser();
    const { name } = await request.json();

    // Check if user has permission to manage their own API keys for this app
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.MANAGE_OWN_API_KEYS
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userRole = await PermissionService.getUserAppRole(user.id, appId);
    const generatedKey = generateApiKey();

    const apiKey = await db.apiKey.create({
      data: {
        key: generatedKey,
        name: name || 'Customer API Key',
        userId: user.id,
        echoAppId: appId,
        createdByUserId: user.id,
        scope: 'customer',
        customerRole: userRole || 'customer',
      },
    });

    return NextResponse.json({ apiKey }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer API key:', error);

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
