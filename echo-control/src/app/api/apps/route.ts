import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/apps - List all Echo apps for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);

    const echoApps = await db.echoApp.findMany({
      where: {
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
        is_active: app.isActive,
        created_at: app.createdAt.toISOString(),
        updated_at: app.updatedAt.toISOString(),
        authorized_callback_urls: app.authorizedCallbackUrls,
        active_api_keys: app._count.apiKeys,
      })),
    });
  } catch (error) {
    console.error('Error fetching Echo apps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
        userId: user.id,
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
