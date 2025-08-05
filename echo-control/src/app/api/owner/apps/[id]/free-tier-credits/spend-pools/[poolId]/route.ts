import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateSpendPool } from '@/lib/spend-pools';
import { PermissionService, Permission } from '@/lib/permissions';

// PUT /api/owner/apps/[id]/free-tier-credits/spend-pools/[poolId] - Update spend pool
export async function PUT(
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
        { error: 'Permission denied - only app owners can update spend pools' },
        { status: 403 }
      );
    }

    const { name, description, defaultSpendLimit } = body;

    const updateData: {
      name?: string;
      description?: string;
      defaultSpendLimit?: number;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (defaultSpendLimit !== undefined) {
      if (typeof defaultSpendLimit !== 'number' || defaultSpendLimit < 0) {
        return NextResponse.json(
          { error: 'defaultSpendLimit must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.defaultSpendLimit = defaultSpendLimit;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    await updateSpendPool(poolId, updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating spend pool limit:', error);

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
