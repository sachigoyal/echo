import { db } from '@/lib/db';
import { paginationParamsSchema } from '@/lib/pagination';
import { z } from 'zod';
import { appSelect } from './lib/select';
import { MembershipStatus } from '@/lib/permissions';
import { Prisma } from '@/generated/prisma';
import { toPaginatedReponse } from '../lib/pagination';

export const getAppSchema = z.uuid();

export const getAppMembership = async (
  userId: string,
  appId: z.infer<typeof getAppSchema>
) => {
  return await db.appMembership.findUnique({
    where: {
      userId_echoAppId: {
        userId,
        echoAppId: appId,
      },
    },
    select: {
      role: true,
      status: true,
      echoApp: {
        select: appSelect,
      },
    },
  });
};

export const listApps = async (
  userId: string,
  { page = 0, page_size = 10 }: z.infer<typeof paginationParamsSchema>
) => {
  const listMembershipWhere = (
    userId: string
  ): Prisma.AppMembershipWhereInput => {
    return {
      userId,
      isArchived: false,
      status: MembershipStatus.ACTIVE,
    };
  };

  const skip = page * page_size;

  const [totalCount, appMemberships] = await Promise.all([
    db.appMembership.count({
      where: listMembershipWhere(userId),
    }),
    db.appMembership.findMany({
      where: listMembershipWhere(userId),
      skip,
      take: page_size,
      select: {
        role: true,
        status: true,
        echoApp: {
          select: appSelect,
        },
      },
    }),
  ]);

  return toPaginatedReponse({
    items: appMemberships,
    page,
    page_size,
    total_count: totalCount,
  });
};
