import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/echo-apps - List echo apps for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, echoApp, isApiKeyAuth } = await getAuthenticatedUser(request);

    const whereClause: {
      userId: string;
      id?: string;
    } = { userId: user.id };

    // If using API key authentication, only return the app the key is scoped to
    if (isApiKeyAuth && echoApp) {
      whereClause.id = echoApp.id;
    }

    const echoApps = await db.echoApp.findMany({
      where: whereClause,
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
            lastUsed: true,
            // Don't include the actual key in responses
          },
        },
        _count: {
          select: {
            apiKeys: true,
            llmTransactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate usage statistics for each app
    const echoAppsWithStats = await Promise.all(
      echoApps.map(async app => {
        const transactions = await db.llmTransaction.aggregate({
          where: { echoAppId: app.id },
          _sum: {
            totalTokens: true,
            cost: true,
          },
        });

        return {
          ...app,
          totalTokens: transactions._sum.totalTokens || 0,
          totalCost: transactions._sum.cost || 0,
        };
      })
    );

    return NextResponse.json({ echoApps: echoAppsWithStats });
  } catch (error) {
    console.error('Error fetching echo apps:', error);

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

// POST /api/echo-apps - Create a new echo app for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const { user, isApiKeyAuth } = await getAuthenticatedUser(request);

    // API key users cannot create new apps
    if (isApiKeyAuth) {
      return NextResponse.json(
        { error: 'API key authentication cannot create new apps' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const echoApp = await db.echoApp.create({
      data: {
        name,
        description: description || null,
        userId: user.id,
      },
      include: {
        apiKeys: true,
        _count: {
          select: {
            apiKeys: true,
            llmTransactions: true,
          },
        },
      },
    });

    return NextResponse.json({ echoApp }, { status: 201 });
  } catch (error) {
    console.error('Error creating echo app:', error);

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
