import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { PermissionService } from '@/lib/permissions/service';
import { AppRole } from '@/lib/permissions/types';

// GET /api/echo-apps - List all accessible echo apps for authenticated user (both owned and customer)
export async function GET(request: NextRequest) {
  try {
    const { user, echoApp, isApiKeyAuth } = await getAuthenticatedUser(request);

    // If using API key authentication, only return the app the key is scoped to
    if (isApiKeyAuth && echoApp) {
      const transactions = await db.llmTransaction.aggregate({
        where: {
          echoAppId: echoApp.id,
          isArchived: false,
        },
        _sum: {
          totalTokens: true,
          cost: true,
        },
      });

      const appWithStats = {
        ...echoApp,
        totalTokens: transactions._sum.totalTokens || 0,
        totalCost: transactions._sum.cost || 0,
        userRole: AppRole.OWNER, // Assume owner for API key auth for backward compatibility
      };

      return NextResponse.json({ echoApps: [appWithStats] });
    }

    // Get all accessible apps (owned + customer + admin)
    const accessibleApps = await PermissionService.getAccessibleApps(user.id);

    const appsWithDetails = await Promise.all(
      accessibleApps.map(async ({ app, userRole }) => {
        const appDetails = await db.echoApp.findUnique({
          where: { id: app.id },
          include: {
            apiKeys: {
              where: {
                isArchived: false,
                // Show only user's own keys for customers
                ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
              },
              select: {
                id: true,
                name: true,
                isActive: true,
                createdAt: true,
                lastUsed: true,
                scope: true,
              },
            },
            _count: {
              select: {
                apiKeys: {
                  where: {
                    isArchived: false,
                    ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
                  },
                },
                llmTransactions: {
                  where: {
                    isArchived: false,
                    ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
                  },
                },
              },
            },
          },
        });

        // Calculate usage statistics
        const transactions = await db.llmTransaction.aggregate({
          where: {
            echoAppId: app.id,
            isArchived: false,
            // Filter by user for customers
            ...(userRole === AppRole.CUSTOMER && { userId: user.id }),
          },
          _sum: {
            totalTokens: true,
            cost: true,
          },
        });

        return {
          ...appDetails,
          userRole,
          totalTokens: transactions._sum.totalTokens || 0,
          totalCost: transactions._sum.cost || 0,
          permissions: await PermissionService.getUserAppAccess(
            user.id,
            app.id
          ),
        };
      })
    );

    return NextResponse.json({
      echoApps: appsWithDetails,
      userRoles: accessibleApps.reduce(
        (acc, { app, userRole }) => {
          acc[app.id] = userRole;
          return acc;
        },
        {} as Record<string, AppRole>
      ),
    });
  } catch (error) {
    console.error('Error fetching echo apps:', error);

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

  return NextResponse.redirect(url, 308); // Permanent redirect
}

export async function POST(req: NextRequest) {
  const url = new URL('/api/apps', req.url);
  return NextResponse.redirect(url, 308);
}
