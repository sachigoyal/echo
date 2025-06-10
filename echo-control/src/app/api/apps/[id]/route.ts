import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/apps/[id] - Get a specific Echo app
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const { id } = await params;

    const echoApp = await db.echoApp.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        authorizedCallbackUrls: true,
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            key: true,
            name: true,
            createdAt: true,
            lastUsed: true,
            metadata: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            llmTransactions: true,
            payments: true,
          },
        },
      },
    });

    if (!echoApp) {
      return NextResponse.json(
        { error: 'Echo app not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: echoApp.id,
      name: echoApp.name,
      description: echoApp.description,
      isActive: echoApp.isActive,
      createdAt: echoApp.createdAt.toISOString(),
      updatedAt: echoApp.updatedAt.toISOString(),
      authorizedCallbackUrls: echoApp.authorizedCallbackUrls,
      apiKeys: echoApp.apiKeys.map(key => ({
        id: key.id,
        key: key.key,
        name: key.name,
        isActive: true, // Keys are filtered to active ones only
        createdAt: key.createdAt.toISOString(),
        lastUsed: key.lastUsed?.toISOString() || null,
        metadata: key.metadata,
      })),
      stats: {
        totalTransactions: echoApp._count.llmTransactions,
        totalTokens: 0, // TODO: Calculate from transactions
        totalInputTokens: 0, // TODO: Calculate from transactions
        totalOutputTokens: 0, // TODO: Calculate from transactions
        totalCost: 0, // TODO: Calculate from transactions
        modelUsage: [], // TODO: Calculate from transactions
      },
      recentTransactions: [], // TODO: Fetch recent transactions
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching Echo app:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/apps/[id] - Update a specific Echo app
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const { id } = await params;
    const body = await req.json();

    const { name, description, is_active } = body;

    // Validate input
    const updateData: {
      name?: string;
      description?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'App name is required' },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'App name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string or null' },
          { status: 400 }
        );
      }
      if (description && description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be 500 characters or less' },
          { status: 400 }
        );
      }
      updateData.description = description?.trim() || null;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return NextResponse.json(
          { error: 'is_active must be a boolean' },
          { status: 400 }
        );
      }
      updateData.isActive = is_active;
    }

    // Check if app exists and user owns it
    const existingApp = await db.echoApp.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingApp) {
      return NextResponse.json(
        { error: 'Echo app not found' },
        { status: 404 }
      );
    }

    // Update the app
    const updatedApp = await db.echoApp.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        authorizedCallbackUrls: true,
      },
    });

    return NextResponse.json({
      id: updatedApp.id,
      name: updatedApp.name,
      description: updatedApp.description,
      is_active: updatedApp.isActive,
      created_at: updatedApp.createdAt.toISOString(),
      updated_at: updatedApp.updatedAt.toISOString(),
      authorized_callback_urls: updatedApp.authorizedCallbackUrls,
    });
  } catch (error) {
    console.error('Error updating Echo app:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/apps/[id] - Delete a specific Echo app
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const { id } = await params;

    // Check if app exists and user owns it
    const existingApp = await db.echoApp.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingApp) {
      return NextResponse.json(
        { error: 'Echo app not found' },
        { status: 404 }
      );
    }

    // Delete the app (cascade will handle related records)
    await db.echoApp.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Echo app deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Echo app:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
