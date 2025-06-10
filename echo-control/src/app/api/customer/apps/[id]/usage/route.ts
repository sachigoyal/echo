import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { PermissionService } from '@/lib/permissions/service';
import { Permission } from '@/lib/permissions/types';

// GET /api/customer/apps/[id]/usage - Get usage data for customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appId } = await params;
    const { user } = await getAuthenticatedUser(request);

    // Check if user has permission to view their own usage
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.VIEW_OWN_USAGE
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Get customer's transactions for this app
    const transactions = await db.llmTransaction.aggregate({
      where: {
        echoAppId: appId,
        userId: user.id,
        isArchived: false,
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    });

    // Get customer's payments for this app
    const payments = await db.payment.aggregate({
      where: {
        echoAppId: appId,
        payerUserId: user.id,
        status: 'completed',
        isArchived: false,
      },
      _sum: {
        amount: true,
      },
    });

    const totalSpent = Number(transactions._sum.cost || 0);
    const totalPaid = (payments._sum.amount || 0) / 100; // Convert cents to dollars
    const balance = totalPaid - totalSpent;

    const usage = {
      totalTransactions: transactions._count,
      totalTokens: transactions._sum.totalTokens || 0,
      totalSpent: totalSpent.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      balance: balance.toFixed(2),
      currency: 'USD',
    };

    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Error fetching customer usage:', error);

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
