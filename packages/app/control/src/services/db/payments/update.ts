import { db } from '@/services/db/client';

import type { PaymentStatus } from '@/types/payments';

export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus
) => {
  return await db.payment.update({
    where: { paymentId: id },
    data: { status: status },
  });
};
