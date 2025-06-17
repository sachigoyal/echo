import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/apps/[id]/owner-details - Get basic app info and owner details for OAuth flows
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (
      !id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid app ID format' },
        { status: 400 }
      );
    }

    // Fetch app with owner details - no authentication required for OAuth flows
    const echoApp = await db.echoApp.findUnique({
      where: {
        id,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        appMemberships: {
          where: {
            role: 'owner',
            isArchived: false,
          },
          select: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!echoApp) {
      return NextResponse.json(
        { error: 'Echo app not found or inactive' },
        { status: 404 }
      );
    }

    // Find the owner
    const owner = echoApp.appMemberships.find(
      membership => membership.role === 'owner'
    );

    return NextResponse.json({
      id: echoApp.id,
      name: echoApp.name,
      description: echoApp.description,
      owner: owner
        ? {
            name: owner.user.name,
            email: owner.user.email,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching app owner details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
