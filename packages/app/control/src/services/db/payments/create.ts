import { db } from '../client';

import type { Prisma } from '@/generated/prisma';

export const createPayment = async (
  data: Prisma.PaymentCreateArgs['data'],
  tx?: Prisma.TransactionClient
) => {
  const client = tx ?? db;
  return await client.payment.create({
    data,
  });
};
