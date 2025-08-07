import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateSpendPool } from '@/lib/spend-pools';
import { PermissionService, Permission } from '@/lib/permissions';

// POST /api/owner/apps/[id]/free-tier-credits/spend-pools/[poolId]/limits - Update pool default spend limit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; poolId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: appId, poolId } = await params;
    const body = await request.json();

    // Verify user has permission to manage billing for this app
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.MANAGE_BILLING
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Permission denied - only app owners can update spend limits',
        },
        { status: 403 }
      );
    }

    const { defaultSpendLimit } = body;

    if (typeof defaultSpendLimit !== 'number' || defaultSpendLimit < 0.01) {
      return NextResponse.json(
        { error: 'Spend limit must be at least $0.01' },
        { status: 400 }
      );
    }

    await updateSpendPool(poolId, { defaultSpendLimit });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating spend limit:', error);

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Spend pool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
