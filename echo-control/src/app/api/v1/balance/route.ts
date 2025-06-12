import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getBalance } from '@/lib/balance';

// GET /api/v1/balance - Get authenticated user balance (optionally for a specific app)
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const echoAppId = searchParams.get('echoAppId');

    const balanceResult = await getBalance(user, echoAppId);

    return NextResponse.json(balanceResult);
  } catch (error) {
    console.error('Error fetching balance:', error);

    if (
      error instanceof Error &&
      (error.message === 'Not authenticated' ||
        error.message.includes('Invalid') ||
        error.message === 'App membership not found')
    ) {
      const status = error.message === 'App membership not found' ? 404 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
