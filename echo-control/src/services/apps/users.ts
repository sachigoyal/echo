import z from 'zod';

import { db } from '@/lib/db';
import {
  type PaginationParams,
  toPaginatedReponse,
} from '@/services/lib/pagination';

export const listAppUsersSchema = z.object({
  appId: z.uuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const listAppUsers = async (
  { appId, startDate, endDate }: z.infer<typeof listAppUsersSchema>,
  { page, page_size }: PaginationParams
) => {
  const [count, users] = await Promise.all([
    db.appMembership.count({
      where: {
        echoAppId: appId,
        isArchived: false,
        totalSpent: {
          gt: 0,
        },
      },
    }),
    (async () => {
      const topUsersWithStats = await db.transaction.groupBy({
        by: ['userId'],
        where: {
          echoAppId: appId,
          isArchived: false,
          ...((startDate || endDate) && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        },
        _sum: {
          totalCost: true,
          rawTransactionCost: true,
          markUpProfit: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            totalCost: 'desc',
          },
        },
        skip: page * page_size,
        take: page_size,
      });

      // Get user details and membership info for the top users
      const userIds = topUsersWithStats.map(stat => stat.userId);

      const usersWithDetails = await db.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          appMemberships: {
            where: {
              echoAppId: appId,
              isArchived: false,
              status: 'active',
            },
            select: {
              totalSpent: true,
              amountSpent: true,
              createdAt: true,
            },
          },
        },
      });

      // Combine the data
      const users = topUsersWithStats.map(stat => {
        const user = usersWithDetails.find(u => u.id === stat.userId);

        if (!user) {
          return null;
        }

        return {
          ...user,
          membership: user.appMemberships[0] ?? null,
          usage: {
            totalTransactions: stat._count.id,
            totalCost: Number(stat._sum.totalCost ?? 0),
            rawCost: Number(stat._sum.rawTransactionCost ?? 0),
            markupProfit: Number(stat._sum.markUpProfit ?? 0),
          },
        };
      });

      return users.filter(Boolean) as NonNullable<(typeof users)[number]>[];
    })(),
  ]);

  return toPaginatedReponse({
    items: users,
    total_count: count,
    page,
    page_size,
  });
};
