import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AppRole, MembershipStatus } from '@/lib/permissions/types';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/apps - List all Echo apps for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);

    const echoApps = await db.echoApp.findMany({
      where: {
        appMemberships: {
          some: {
            userId: user.id,
            status: MembershipStatus.ACTIVE,
            isArchived: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        authorizedCallbackUrls: true,
        _count: {
          select: {
            apiKeys: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      apps: echoApps.map(app => ({
        id: app.id,
        name: app.name,
        description: app.description,
        isActive: app.isActive,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        authorizedCallbackUrls: app.authorizedCallbackUrls,
        totalTokens: 0, // TODO: Calculate from llmTransactions
        totalCost: 0, // TODO: Calculate from llmTransactions
        _count: {
          apiKeys: app._count.apiKeys,
          llmTransactions: 0, // TODO: Add this to the query
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching Echo apps:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Authentication required', details: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/apps - Create a new Echo app
export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const body = await req.json();

    const { name, description } = body;

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

    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    const echoApp = await db.echoApp.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        appMemberships: {
          create: {
            userId: user.id,
            role: AppRole.OWNER,
            status: MembershipStatus.ACTIVE,
            isArchived: false,
            totalSpent: 0,
          },
        },
        isActive: true,
        authorizedCallbackUrls: [], // Start with empty callback URLs
      },
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

    return NextResponse.json(
      {
        id: echoApp.id,
        name: echoApp.name,
        description: echoApp.description,
        is_active: echoApp.isActive,
        created_at: echoApp.createdAt.toISOString(),
        updated_at: echoApp.updatedAt.toISOString(),
        authorized_callback_urls: echoApp.authorizedCallbackUrls,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating Echo app:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
