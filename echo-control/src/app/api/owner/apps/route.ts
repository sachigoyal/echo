import { getCurrentUser } from '@/lib/auth';
import { listAppsWithDetails } from '@/lib/echo-apps';
import { AppRole } from '@/lib/permissions/types';
import { NextResponse } from 'next/server';

// GET /api/apps - List all Echo apps for the authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();
    const apps = await listAppsWithDetails(user.id, AppRole.OWNER);

    return NextResponse.json({ apps });
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
