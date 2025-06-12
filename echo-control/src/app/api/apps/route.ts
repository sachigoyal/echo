import { getCurrentUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  listAppsWithDetails,
  createEchoApp,
  AppCreateInput,
} from '@/lib/echo-apps';

// GET /api/apps - List all Echo apps for the authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();
    const apps = await listAppsWithDetails(user.id);

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

// POST /api/apps - Create a new Echo app
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const { name, description } = body;
    const appData: AppCreateInput = { name, description };

    const echoApp = await createEchoApp(user.id, appData);

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

    // Handle validation errors
    if (
      error instanceof Error &&
      (error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('characters'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
