import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { EchoApp, User } from '@/generated/prisma';
import { getApp } from '@/lib/apps';

// GET /api/v1/apps/[id] - Get detailed app information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user: User;
    let echoApp: EchoApp;
    try {
      const { user: userResult, echoApp: echoAppResult } =
        await getAuthenticatedUser(request);
      user = userResult;
      echoApp = echoAppResult;
    } catch (error) {
      console.error('Error fetching echo app:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: appId } = resolvedParams;

    if (echoApp && echoApp.id !== appId) {
      return NextResponse.json(
        { error: 'Access denied: App not found' },
        { status: 403 }
      );
    }

    const appWithStats = await getApp(appId, user.id);

    return NextResponse.json(appWithStats);
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

    if (
      error instanceof Error &&
      error.message.includes('not found or access denied')
    ) {
      return NextResponse.json(
        { error: 'Echo app not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
