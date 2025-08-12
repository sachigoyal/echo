import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserGlobalBalance, getUserAppBalance } from '@/lib/balance';
import { User } from '@/generated/prisma';

// GET /api/v1/balance - Get authenticated user balance (optionally for a specific app)
export async function GET(request: NextRequest) {
  let user: User;
  try {
    const { user: userResult } = await getAuthenticatedUser(request);
    user = userResult;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const echoAppId = request.nextUrl.searchParams.get('echoAppId');

  if (!echoAppId) {
    try {
      const balance = await getUserGlobalBalance(user.id);
      return NextResponse.json(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }
  }

  try {
    const balanceResult = await getUserAppBalance(user.id, echoAppId);

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
