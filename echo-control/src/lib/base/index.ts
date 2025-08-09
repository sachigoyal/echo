import { NextRequest } from 'next/server';
import { db } from '../db';
import { processPaymentUpdate } from '../payment-processing';

export const formatAmountFromQueryParams = (
  req: NextRequest
): number | null => {
  const formattedAmount = req.nextUrl.searchParams.get('amount') || '1';

  const amount = parseFloat(formattedAmount);

  if (isNaN(amount)) {
    return null;
  }

  return amount;
};

export const formatPriceForMiddleware = (amount: number): string => {
  return '$' + amount;
};

export async function handlePaymentSuccessFromx402({
  userId,
  amount,
  currency,
  metadata,
}: {
  userId: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}) {
  try {
    if (!userId) {
      console.error('No userId in payment metadata');
      return;
    }

    const cryptoMetadata = {
      'payment-type': 'x402',
      'transaction-id': 'x402_' + crypto.randomUUID(),
      amount: amount.toString(),
      currency: currency,
      ...metadata,
    };

    // Use a database transaction to atomically update payment status and user balance
    await db.$transaction(async tx => {
      // Update payment in database
      const paymentRecord = await tx.payment.upsert({
        where: { stripePaymentId: cryptoMetadata['transaction-id'] },
        update: { status: 'completed' },
        create: {
          stripePaymentId: cryptoMetadata['transaction-id'],
          amount,
          currency,
          status: 'completed',
          description: 'Echo credits purchase with x402',
          userId,
        },
      });

      // Process the payment update using the cleaned up payment processing logic
      await processPaymentUpdate(tx, {
        userId,
        amountInCents: amount,
        paymentRecord,
        metadata: cryptoMetadata || {},
        echoAppId: metadata?.echoAppId,
      });
    });

    const isFreeTier = metadata?.type === 'free-tier-credits';
    console.log(
      `Payment succeeded: ${cryptoMetadata['transaction-id']}${isFreeTier ? ' (free tier pool)' : ', totalPaid updated'}`
    );
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}
