import { NextRequest, NextResponse } from 'next/server';
import { getPublicAppsInfo } from '@/lib/echo-apps';

// GET /api/apps/public - List all publicly available Echo apps with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be a positive integer' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const result = await getPublicAppsInfo(page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching public Echo apps:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
