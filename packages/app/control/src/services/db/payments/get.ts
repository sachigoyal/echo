import { db } from '@/services/db/client';

export const getPaymentById = async (id: string) => {
  return await db.payment.findUnique({
    where: { paymentId: id },
  });
};
