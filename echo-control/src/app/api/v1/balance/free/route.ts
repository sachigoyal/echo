import { getCustomerSpendInfoForApp } from '@/lib/spend-pools/fetch-user-spend';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/generated/prisma';

// POST /api/v1/balance/free - Get authenticated user's free tier spend info for a specific app
export async function POST(request: NextRequest) {
  try {
    let user: User;
    try {
      const { user: userResult } = await getAuthenticatedUser(request);
      user = userResult;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spendPoolBalance = await getCustomerSpendInfoForApp(user.id, 'echo');

    return NextResponse.json({
      spendPoolBalance,
    });
  } catch (error) {
    console.error('Error fetching customer spend info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = POST;
