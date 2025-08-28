import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PermissionService } from '@/lib/permissions/service';
import { Permission } from '@/lib/permissions/types';
import { logger } from '@/logger';

// GET /api/owner/apps/[id]/api-keys - List all API keys for an app with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    // Check if user has permission to manage API keys for this app
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.MANAGE_ALL_API_KEYS
    );

    if (!hasPermission) {
      logger.emit({
        severityText: 'WARN',
        body: 'Permission denied for API keys access',
        attributes: {
          userId: user.id,
          appId,
          permission: Permission.MANAGE_ALL_API_KEYS,
        },
      });
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Optional pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get all API keys for this app with pagination
    const apiKeys = await db.apiKey.findMany({
      where: {
        echoAppId: appId,
        isArchived: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await db.apiKey.count({
      where: {
        echoAppId: appId,
        isArchived: false,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);

    logger.emit({
      severityText: 'INFO',
      body: 'Successfully retrieved API keys for app',
      attributes: {
        appId,
        userId: user.id,
        count: apiKeys.length,
        totalCount,
        page,
      },
    });

    return NextResponse.json({
      apiKeys,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error fetching app API keys',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    if (
      error instanceof Error &&
      (error.message === 'Not authenticated' ||
        error.message.includes('Invalid'))
    ) {
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
