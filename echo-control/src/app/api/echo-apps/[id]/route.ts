import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { softDeleteEchoApp } from '@/lib/soft-delete';
import { PermissionService } from '@/lib/permissions/service';
import { Permission, AppRole } from '@/lib/permissions/types';

// GET /api/echo-apps/[id] - Get detailed app information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, echoApp, isApiKeyAuth } = await getAuthenticatedUser(request);
    const resolvedParams = await params;
    const { id: appId } = resolvedParams;

    // If using API key auth, ensure they can only access their scoped app
    if (isApiKeyAuth && echoApp && echoApp.id !== appId) {
      return NextResponse.json(
        { error: 'Access denied: API key not scoped to this app' },
        { status: 403 }
      );
    }

    // Check if user has permission to read this app
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.READ_APP
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    // Get user's role for this app to determine what data to show
    const userRole = await PermissionService.getUserAppRole(user.id, appId);

    // Find the app
    const app = await db.echoApp.findFirst({
      where: {
        id: appId,
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
        apiKeys: {
          where: {
            isArchived: false,
            // Customers can only see their own API keys
            ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
          },
          select: {
            id: true,
            name: true,
            key: true,
            isActive: true,
            createdAt: true,
            lastUsed: true,
            createdBy: {
              select: {
                email: true,
                name: true,
              },
            },
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            apiKeys: {
              where: {
                isArchived: false,
                ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
              },
            },
            llmTransactions: {
              where: {
                isArchived: false,
                ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
              },
            },
          },
        },
      },
    });

    if (!app) {
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    // Get aggregated statistics for the app (filtered by user for customers)
    const stats = await db.llmTransaction.aggregate({
      where: {
        echoAppId: appId,
        isArchived: false,
        // Filter by user for customers
        ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
      },
      _count: true,
      _sum: {
        totalTokens: true,
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
    });

    // Get model usage breakdown (filtered by user for customers)
    const modelUsage = await db.llmTransaction.groupBy({
      by: ['model'],
      where: {
        echoAppId: appId,
        isArchived: false,
        ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
      },
      _count: true,
      _sum: {
        totalTokens: true,
        cost: true,
      },
      orderBy: {
        _sum: {
          totalTokens: 'desc',
        },
      },
    });

    // Get recent transactions (filtered by user for customers)
    const recentTransactions = await db.llmTransaction.findMany({
      where: {
        echoAppId: appId,
        isArchived: false,
        ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
      },
      select: {
        id: true,
        model: true,
        totalTokens: true,
        cost: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate total spent for each API key
    const apiKeysWithSpending = await Promise.all(
      app.apiKeys.map(async apiKey => {
        // Get total spending for this API key
        // Note: We'll need to add apiKeyId to LlmTransaction model to track per-key spending
        // For now, we'll set totalSpent to 0 as a placeholder
        const totalSpent = 0; // TODO: Implement API key spending tracking

        return {
          ...apiKey,
          totalSpent,
          creator: apiKey.createdBy || apiKey.user || null,
        };
      })
    );

    const appWithStats = {
      ...app,
      apiKeys: apiKeysWithSpending,
      stats: {
        totalTransactions: stats._count || 0,
        totalTokens: stats._sum.totalTokens || 0,
        totalInputTokens: stats._sum.inputTokens || 0,
        totalOutputTokens: stats._sum.outputTokens || 0,
        totalCost: stats._sum.cost || 0,
        modelUsage,
      },
      recentTransactions,
    };

    return NextResponse.json({ echoApp: appWithStats });
  } catch (error) {
    console.error('Error fetching echo app:', error);

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

// PUT /api/echo-apps/[id] - Update app information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isApiKeyAuth } = await getAuthenticatedUser(request);
    const resolvedParams = await params;
    const { id: appId } = resolvedParams;

    // API key users cannot update apps
    if (isApiKeyAuth) {
      return NextResponse.json(
        { error: 'API key authentication cannot update apps' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    // Verify the echo app exists and belongs to the user
    const existingApp = await db.echoApp.findFirst({
      where: {
        id: appId,
        userId: user.id,
        isArchived: false, // Only allow updating non-archived apps
      },
    });

    if (!existingApp) {
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    // Update the app
    const updatedApp = await db.echoApp.update({
      where: { id: appId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            apiKeys: true,
            llmTransactions: true,
          },
        },
      },
    });

    return NextResponse.json({ echoApp: updatedApp });
  } catch (error) {
    console.error('Error updating echo app:', error);

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

// DELETE /api/echo-apps/[id] - Archive an echo app (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, isApiKeyAuth } = await getAuthenticatedUser(request);
    const resolvedParams = await params;
    const { id: appId } = resolvedParams;

    // API key users cannot delete apps
    if (isApiKeyAuth) {
      return NextResponse.json(
        { error: 'API key authentication cannot delete apps' },
        { status: 403 }
      );
    }

    // Verify the echo app exists and belongs to the user
    const existingApp = await db.echoApp.findFirst({
      where: {
        id: appId,
        userId: user.id,
        isArchived: false, // Only allow archiving non-archived apps
      },
    });

    if (!existingApp) {
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete the echo app and all related records
    await softDeleteEchoApp(appId);

    return NextResponse.json({
      success: true,
      message: 'Echo app and related data archived successfully',
    });
  } catch (error) {
    console.error('Error archiving echo app:', error);

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
