import { z } from 'zod';

import { db } from '@/lib/db';
import { appSelect } from './lib/select';
import { AppRole, MembershipStatus } from '@/lib/permissions';
import { Prisma } from '@/generated/prisma';

import { paginationSchema, toPaginatedReponse } from '../lib/pagination';

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

export const listMemberApps = async (
  userId: string,
  { page, page_size }: z.infer<typeof paginationSchema>
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

// this will throw if the user is already a member because user_echoAppId is unique
export const joinApp = async (userId: string, echoAppId: string) => {
  return db.appMembership.create({
    data: {
      userId,
      echoAppId,
      role: AppRole.CUSTOMER,
      status: MembershipStatus.ACTIVE,
      totalSpent: 0,
    },
  });
};
