import { env } from '@/env';
import { meritClient } from './client';
import { adminGroupedUserPayoutSchema, adminListStartedPayoutBatches } from '../db/admin/payouts';
import type z from 'zod';
import { randomUUID } from 'crypto';
import {
  adminMarkPayoutBatchCompleted,
  adminMarkPayoutsStarted,
} from '../db/admin/payouts';

const SENDER_GITHUB_ID = Number(env.MERIT_SENDER_GITHUB_ID);

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || !error) return false;
  
  const errorObj = error as Record<string, unknown>;
  
  // Check for common rate limit indicators
  if (typeof errorObj.message === 'string') {
    const message = errorObj.message.toLowerCase();
    if (message.includes('rate limit') || 
        message.includes('too many requests') ||
        message.includes('429')) {
      return true;
    }
  }
  
  // Check for HTTP status code
  if (typeof errorObj.statusCode === 'number' && errorObj.statusCode === 429) {
    return true;
  }
  
  // Check for status in the error message (e.g., "HTTP 429: ...")
  if (typeof errorObj.message === 'string' && errorObj.message.includes('HTTP 429')) {
    return true;
  }
  
  return false;
}

export async function startPayoutBatch(
  payoutBatch: z.infer<typeof adminGroupedUserPayoutSchema>,
  senderGithubId: number = SENDER_GITHUB_ID
): Promise<string> {
  const payoutBatchId = randomUUID();

  await adminMarkPayoutsStarted(
    payoutBatch.payouts.map(payout => payout.id),
    payoutBatchId
  );

  const items = groupPayoutsByGithubIdAndType(payoutBatch.payouts);
  return meritClient.checkout.generateCheckoutUrl({
    items,
    senderGithubId,
    groupId: payoutBatchId,
  });
}

export async function attemptPayoutBatchCompletion(
  payoutBatchId: string
): Promise<number> {
  const payout = await meritClient.payments.getPaymentsBySender(
    SENDER_GITHUB_ID,
    {
      group_id: payoutBatchId,
    }
  ).catch(error => {
    // Handle rate limits and other API errors gracefully
    if (isRateLimitError(error)) {
      console.log(`Rate limit hit for payout batch ${payoutBatchId}, will retry on next poll`);
      return { items: [] }; // Return empty result to indicate no payouts processed yet
    }
    // Log other errors but don't throw to prevent Internal Server Error
    console.error(`Merit API error for payout batch ${payoutBatchId}:`, error.message || error);
    return { items: [] }; // Return empty result to indicate no payouts processed yet
  });
  
  // If any of the payouts are completed, update the status of the payout batch to completed
  if (payout.items.length > 0) { 
    return await adminMarkPayoutBatchCompleted(payoutBatchId);
  }
  return 0;
}

export async function pollAvailablePaymentBatches(): Promise<number> {
  const payoutBatches = await adminListStartedPayoutBatches();
  for (const payoutBatchId of payoutBatches) {
    const updated = await attemptPayoutBatchCompletion(payoutBatchId);
    if (updated > 0) {
      return updated;
    }
  }
  return 0;
}


function groupPayoutsByGithubIdAndType(payouts: z.infer<typeof adminGroupedUserPayoutSchema>['payouts']) {
  const grouped = payouts.reduce((acc, payout) => {
    const key = `${payout.recipientGithubLink.githubId}`;
    const amount = Number(payout.amount);
    
    acc[key] = acc[key] 
      ? { ...acc[key], amount: acc[key].amount + amount }
      : {
          type: payout.recipientGithubLink.githubType,
          id: payout.recipientGithubLink.githubId,
          amount,
        };
    
    return acc;
  }, {} as Record<string, { type: "user" | "repo"; id: number; amount: number }>);

  return Object.values(grouped).filter(item => item.amount > 0);
}