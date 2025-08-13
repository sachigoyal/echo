import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createApiKey } from '@/services/api-keys';

// POST /api/api-keys - Create a new API key for authenticated user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { echoAppId, name } = body;

    if (!echoAppId) {
      return NextResponse.json(
        { error: 'Echo App ID is required' },
        { status: 400 }
      );
    }

    try {
      const apiKey = await createApiKey(user.id, {
        echoAppId,
        name,
      });
      return NextResponse.json({ apiKey }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'Permission denied') {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error('Error creating API key:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
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
