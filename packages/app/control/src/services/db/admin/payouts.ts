import { db } from '@/services/db/client';
import {
  PaginatedResponse,
  type PaginationParams,
  toPaginatedReponse,
} from '@/services/db/_lib/pagination';
import { z } from 'zod';
import { EnumPayoutStatus, GithubType } from '@/generated/prisma';

export const payoutSchema = z.object({
  id: z.string(),
  recipientGithubLink: z.object({
    githubId: z.number(),
    githubType: z.enum(GithubType),
    githubUrl: z.string(),
  }),
  echoApp: z.object({
    id: z.string(),
    name: z.string(),
  }),
  amount: z.number(),
});

export const adminGroupedUserPayoutSchema = z.object({
  totalOutstanding: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  payouts: z.array(payoutSchema),
});

export const adminGroupedUserPayoutsSchema = z.array(
  adminGroupedUserPayoutSchema
);

export async function adminListPendingPayouts(
  pagination: PaginationParams
): Promise<PaginatedResponse<z.infer<typeof adminGroupedUserPayoutSchema>>> {
  return await fetchGroupedUserPayouts(pagination, [EnumPayoutStatus.PENDING, EnumPayoutStatus.STARTED]);
}

export async function adminListCompletedPayouts(
  pagination: PaginationParams
): Promise<PaginatedResponse<z.infer<typeof adminGroupedUserPayoutSchema>>> {
  return await fetchGroupedUserPayouts(pagination, [EnumPayoutStatus.COMPLETED]);
}

export async function adminListStartedPayoutBatches(): Promise<string[]> {
  const rows = await db.payout.findMany({
    where: {
      status: EnumPayoutStatus.STARTED,
      payoutBatchId: { not: null },
    },
    distinct: ['payoutBatchId'],
    select: { payoutBatchId: true },
    orderBy: { payoutBatchId: 'asc' },
  });
  const uniquePayoutBatchIds = Array.from(new Set(rows.map(r => r.payoutBatchId!).filter((id): id is string => Boolean(id))));
  return uniquePayoutBatchIds;
}

async function groupPayoutsByUserPaginated(
  payoutStatus: EnumPayoutStatus[],
  offset: number,
  pageSize: number
) {
  return await db.payout.groupBy({
    by: ['userId'],
    where: { status: { in: payoutStatus }, userId: { not: null } },
    _sum: { amount: true },
    orderBy: { userId: 'asc' },
    skip: offset,
    take: pageSize,
  });
}

async function findPayoutsForUsersByStatus(
  userIds: string[],
  payoutStatus: EnumPayoutStatus[]
) {
  return await db.payout.findMany({
    where: {
      userId: { in: userIds },
      status: { in: payoutStatus },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      amount: true,
      echoApp: {
        select: {
          id: true,
          name: true,
          githubLink: { select: { githubId: true } },
        },
      },
      recipientGithubLink: {
        select: { githubId: true, githubType: true, githubUrl: true },
      },
    },
  });
}

async function findUsersByIds(userIds: string[]) {
  return await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
}

export async function fetchGroupedUserPayouts(
  pagination: PaginationParams,
  payoutStatus: EnumPayoutStatus[]
): Promise<PaginatedResponse<z.infer<typeof adminGroupedUserPayoutSchema>>> {
  const { page, page_size } = pagination;
  const offset = page * page_size;

  // Page the users via groupBy and compute total distinct user count
  const groupedPage = await groupPayoutsByUserPaginated(
    payoutStatus,
    offset,
    page_size
  );

  const totalCount = groupedPage.length;

  const userIdsOnPage = groupedPage
    .map(g => g.userId)
    .filter((id): id is string => Boolean(id));

  // Fetch only payouts for the paginated userIds
  const payouts = await findPayoutsForUsersByStatus(
    userIdsOnPage,
    payoutStatus,
  );

  const userInfo = await findUsersByIds(userIdsOnPage);
  const userById = new Map(userInfo.map(u => [u.id, u]));

  const totalOutstandingByUserId = new Map(
    groupedPage.map(group => [group.userId, Number(group._sum.amount ?? 0)])
  );

  const items = groupedPage.flatMap(group => {
    const user = userById.get(group.userId!);
    if (!user) return [];
    return [
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
        },
        totalOutstanding: totalOutstandingByUserId.get(group.userId) ?? 0,
        payouts: payouts
          .filter(p => p.userId === group.userId)
          .map(p => ({
            id: p.id,
            recipientGithubLink: p.recipientGithubLink!,
            echoApp: p.echoApp!,
            amount: Number(p.amount),
          })),
      },
    ];
  });

  return toPaginatedReponse({
    items,
    page,
    page_size,
    total_count: totalCount,
  });
}

// Helper functions used by merit payout flow
export async function adminMarkPayoutsStarted(
  payoutIds: string[],
  payoutBatchId: string
): Promise<void> {
  await db.payout.updateMany({
    where: { id: { in: payoutIds } },
    data: { payoutBatchId, status: EnumPayoutStatus.STARTED },
  });
}

export async function adminFindPayoutsForBatch(payoutBatchId: string) {
  return await db.payout.findMany({
    where: { payoutBatchId },
    select: {
      recipientGithubLink: { select: { githubType: true, githubId: true } },
      amount: true,
    },
  });
}

export async function adminMarkPayoutBatchCompleted(
  payoutBatchId: string
): Promise<number> {
  const updated = await db.payout.updateMany({
    where: { payoutBatchId },
    data: { status: EnumPayoutStatus.COMPLETED },
  });
  return updated.count;
}
