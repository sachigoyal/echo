import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/apps/public - List all publicly available Echo apps
export async function GET() {
  try {
    const publicApps = await db.echoApp.findMany({
      where: {
        isPublic: true,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        profilePictureUrl: true,
        bannerImageUrl: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        authorizedCallbackUrls: true,
        _count: {
          select: {
            apiKeys: {
              where: { isActive: true, isArchived: false },
            },
            llmTransactions: {
              where: { isArchived: false },
            },
          },
        },
        appMemberships: {
          where: {
            role: 'owner',
            status: 'active',
            isArchived: false,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get transaction stats for each app
    const appsWithStats = await Promise.all(
      publicApps.map(async app => {
        const transactionStats = await db.llmTransaction.aggregate({
          where: {
            echoAppId: app.id,
            isArchived: false,
          },
          _sum: {
            totalTokens: true,
            cost: true,
          },
        });

        const owner = app.appMemberships[0]?.user;

        return {
          id: app.id,
          name: app.name,
          description: app.description,
          profilePictureUrl: app.profilePictureUrl,
          bannerImageUrl: app.bannerImageUrl,
          isActive: app.isActive,
          isPublic: app.isPublic,
          createdAt: app.createdAt.toISOString(),
          updatedAt: app.updatedAt.toISOString(),
          authorizedCallbackUrls: app.authorizedCallbackUrls,
          totalTokens: transactionStats._sum.totalTokens || 0,
          totalCost: Number(transactionStats._sum.cost || 0),
          _count: {
            apiKeys: app._count.apiKeys,
            llmTransactions: app._count.llmTransactions,
          },
          owner: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            profilePictureUrl: owner.profilePictureUrl,
          },
        };
      })
    );

    return NextResponse.json({ apps: appsWithStats });
  } catch (error) {
    console.error('Error fetching public Echo apps:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
