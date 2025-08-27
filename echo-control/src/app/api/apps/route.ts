import { getCurrentUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { AppCreateInput } from '@/lib/apps/types';
import { createEchoApp } from '@/lib/apps/crud';
import { getOwnerEchoApp } from '@/lib/apps';
import { logger } from '@/logger';

// POST /api/apps - Create a new Echo app
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const { name, description, githubType, githubId, authorizedCallbackUrls } =
      body;
    const appData: AppCreateInput = {
      name,
      description,
      githubType,
      githubId,
      authorizedCallbackUrls,
    };

    const echoApp = await createEchoApp(user.id, appData);

    // Get the complete app details to return to frontend
    const detailedApp = await getOwnerEchoApp(echoApp.id, user.id);

    if (!detailedApp) {
      throw new Error('Failed to retrieve created app details');
    }

    logger.emit({
      severityText: 'INFO',
      body: 'Successfully created Echo app',
      attributes: {
        appId: echoApp.id,
        userId: user.id,
        appName: name,
      },
    });

    return NextResponse.json(detailedApp, { status: 201 });
  } catch (error) {
    logger.emit({
      severityText: 'ERROR',
      body: 'Error creating Echo app',
      attributes: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

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
