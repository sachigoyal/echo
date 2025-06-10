import { NextResponse } from 'next/server';
import { PermissionService } from '@/lib/permissions/service';
import { AppRole } from '@/lib/permissions/types';
import { getCurrentUser } from '@/lib/auth';

// GET /api/customer/apps - List apps user is a customer of
export async function GET() {
  try {
    const user = await getCurrentUser();

    const customerApps = await PermissionService.getAccessibleApps(
      user.id,
      AppRole.CUSTOMER
    );

    return NextResponse.json({
      apps: customerApps.map(({ app, userRole }) => ({
        ...app,
        userRole,
      })),
    });
  } catch (error) {
    console.error('Error fetching customer apps:', error);

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
