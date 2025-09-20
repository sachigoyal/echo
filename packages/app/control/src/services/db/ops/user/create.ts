import { db } from '../../client';

import type { Prisma } from '@/generated/prisma';

export const createUser = async (data: Prisma.UserCreateArgs['data']) => {
  return await db.user.create({
    data,
  });
};
