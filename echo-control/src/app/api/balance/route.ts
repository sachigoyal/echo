import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getAuthenticatedUser } from '@/lib/auth';

// GET /api/balance - Get authenticated user balance (optionally for a specific app)
export async function GET(request: NextRequest) {
  try {
    const { user, echoApp } = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    let echoAppId = searchParams.get('echoAppId');

    let balance: number;
    let totalCredits: number;
    let totalSpent: number;

    if (echoAppId) {
      // App-specific balance: use User.totalPaid for credits and AppMembership.totalSpent for app spending
      const appMembership = await db.appMembership.findUnique({
        where: {
          userId_echoAppId: {
            userId: user.id,
            echoAppId: echoAppId,
          },
        },
        include: {
          user: true,
        },
      });

      if (!appMembership) {
        return NextResponse.json(
          { error: 'App membership not found' },
          { status: 404 }
        );
      }

      totalCredits = Number(appMembership.user.totalPaid);
      totalSpent = Number(appMembership.totalSpent);
      balance = totalCredits - totalSpent;
    } else {
      // Overall balance: use User.totalPaid and User.totalSpent
      totalCredits = Number(user.totalPaid);
      totalSpent = Number(user.totalSpent);
      balance = totalCredits - totalSpent;
    }

    return NextResponse.json({
      balance: balance,
      totalCredits: totalCredits,
      totalSpent: totalSpent,
      currency: 'USD',
      echoAppId: echoAppId || null,
      echoAppName: echoApp?.name || null,
    });
  } catch (error) {
    console.error('Error fetching balance:', error);

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
