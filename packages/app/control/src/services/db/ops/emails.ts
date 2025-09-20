import { db } from '../client';

import type { Prisma } from '@/generated/prisma';

export const createEmail = async (
  data: Prisma.OutboundEmailSentCreateArgs['data']
) => {
  return await db.outboundEmailSent.create({
    data,
  });
};
