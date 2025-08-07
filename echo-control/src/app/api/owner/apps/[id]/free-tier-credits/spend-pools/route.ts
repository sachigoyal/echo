import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAppSpendPools } from '@/lib/spend-pools';
import { PermissionService, Permission } from '@/lib/permissions';

// GET /api/owner/apps/[id]/free-tier-credits/spend-pools - Get spend pools for an app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: appId } = await params;

    // Verify user has permission to view billing for this app
    const hasPermission = await PermissionService.hasPermission(
      user.id,
      appId,
      Permission.MANAGE_BILLING
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied - only app owners can view spend pools' },
        { status: 403 }
      );
    }

    const spendPools = await getAppSpendPools(appId);

    return NextResponse.json({ spendPools }, { status: 200 });
  } catch (error) {
    console.error('Error fetching spend pools:', error);

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
