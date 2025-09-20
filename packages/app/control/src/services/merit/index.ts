import type { OutgoingPayment } from '@merit-systems/sdk';
import { PayoutStatus } from '@/types/payouts';
import { env } from '@/env';
import { meritClient } from './client';
import type { adminGetPayoutSchema } from '../db/ops/admin/payouts';
import {
  adminGetPayout,
  adminListPendingPayouts,
  adminUpdatePayout,
} from '../db/ops/admin/payouts';
import type z from 'zod';

const SENDER_GITHUB_ID = Number(env.MERIT_SENDER_GITHUB_ID);

function generateCheckoutUrl(
  payeeGithubId: number,
  amount: number,
  senderGithubId: number,
  payOutEchoId: string
) {
  return meritClient.checkout.generateCheckoutUrl({
    items: [{ type: 'user', id: payeeGithubId, amount: amount }],
    senderGithubId,
    groupId: payOutEchoId,
  });
}

export async function generateCheckoutUrlForPayout({
  payoutId,
}: z.infer<typeof adminGetPayoutSchema>) {
  const payout = await adminGetPayout({ payoutId });

  if (!payout) {
    throw new Error('Payout not found');
  }
  if (!payout.recipientGithubLink) {
    throw new Error('Recipient GitHub link not found for payout');
  }

  const payeeGithubId = payout.recipientGithubLink.githubId;
  const amount = Number(payout.amount);
  const checkoutUrl = generateCheckoutUrl(
    payeeGithubId,
    amount,
    SENDER_GITHUB_ID,
    payout.id
  );
  return { url: checkoutUrl };
}

async function pollForCompletedPayoutTransaction(
  senderGithubId: number,
  payOutEchoId: string
): Promise<OutgoingPayment[] | null> {
  const payout = await meritClient.payments.getPaymentsBySender(
    senderGithubId,
    {
      group_id: payOutEchoId,
    }
  );
  console.log('payout', payout);
  if (payout.items.length > 0) {
    return payout.items;
  }
  return null;
}

async function logCompletedPayoutTransaction(payout: OutgoingPayment) {
  const existing = await adminGetPayout({ payoutId: payout.group_id! });

  if (!existing) {
    return;
  }

  if (existing.status === (PayoutStatus.COMPLETED as string)) {
    return;
  }

  await adminUpdatePayout({
    payoutId: payout.group_id!,
    status: PayoutStatus.COMPLETED,
    transactionId: payout.tx_hash,
    senderAddress: payout.sender_id.toString(),
  });
}

export async function pollMeritCheckout(payoutId: string) {
  const payout = await adminGetPayout({ payoutId });

  if (!payout) {
    throw new Error('Payout not found');
  }

  const senderGithubId = SENDER_GITHUB_ID;

  // poll every 10 seconds, up to 1 minute (max 6 attempts)
  for (let attempt = 0; attempt < 6; attempt++) {
    const results = await pollForCompletedPayoutTransaction(
      senderGithubId,
      payout.id
    );

    if (results && results.length > 0) {
      await Promise.all(results.map(r => logCompletedPayoutTransaction(r)));
      return { completed: true, count: results.length };
    }

    if (attempt < 5) {
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  return { completed: false };
}

export async function syncPendingPayoutsOnce() {
  const pending = await adminListPendingPayouts({
    page: 0,
    page_size: 10000,
  });

  for (const p of pending.items) {
    const senderGithubId = p.echoApp?.githubLink?.githubId ?? SENDER_GITHUB_ID;
    const results = await pollForCompletedPayoutTransaction(
      senderGithubId,
      p.id
    );
    if (results && results.length > 0) {
      await Promise.all(results.map(r => logCompletedPayoutTransaction(r)));
    }
  }

  return { scanned: pending.items.length };
}
