// For a given user, calculate their historical earnings

import { db } from '../db';

// Breakdown structure for app earnings
export interface EarningsBreakdown {
  totalEarnings: number;
  markupEarnings: {
    total: number;
    beforeReferralReduction: number;
    referralReduction: number;
    transactionCount: number;
  };
  referralEarnings: {
    total: number;
    transactionCount: number;
  };
  breakdown: {
    byUser: Array<{
      userId: string;
      userEmail: string;
      userName: string | null;
      markupEarnings: number;
      transactionCount: number;
    }>;
    byProvider: Array<{
      provider: string;
      model: string;
      earnings: number;
      transactionCount: number;
      totalTokens: number;
    }>;
    byTimeRange: Array<{
      period: string; // YYYY-MM format
      earnings: number;
      transactionCount: number;
    }>;
  };
}

export async function calculateEarningsForUser(
  userId: string
): Promise<number> {
  let totalEarnings = 0;

  // For each transaction
  // cost is already = price * markUp

  // Get all transactions for apps owned by this user
  const ownedAppTransactions = await db.transaction.findMany({
    where: {
      echoApp: {
        appMemberships: {
          some: {
            userId: userId,
            role: 'owner',
          },
        },
      },
      isArchived: false,
    },
    include: {
      markUp: true,
      referrerReward: true,
      echoApp: true,
    },
  });

  for (const transaction of ownedAppTransactions) {
    // so we need to calculate the Markup earned from the transaction
    // markupEarned = cost - (cost / markUp), where cost = baseCost * markUp
    if (transaction.markUp) {
      const markupAmount = transaction.markUp.amount;
      const markupEarned = transaction.totalCost.minus(
        transaction.totalCost.dividedBy(markupAmount.plus(1))
      );

      // Then, we need to reduce the amount of referrer rewards from the markupEarned
      // if referrerAward, then markupEarned = markupEarned - (markupEarned * referrerReward.amount)
      let finalMarkupEarned = markupEarned;
      if (transaction.referrerReward) {
        const rewardReduction = markupEarned.times(
          transaction.referrerReward.amount
        );
        finalMarkupEarned = markupEarned.minus(rewardReduction);
      }

      totalEarnings += parseFloat(finalMarkupEarned.toString());
    }
  }

  // Then, we need to add in the amount the user has earned from referrals

  // for all tx where referrerCode.userId === userId,
  // referralAmountRewarded = tx.cost - (tx.cost / (1 + markUp)) * referrerReward.amount
  const referralTransactions = await db.transaction.findMany({
    where: {
      referralCode: {
        userId: userId,
      },
      isArchived: false,
    },
    include: {
      markUp: true,
      referrerReward: true,
    },
  });

  for (const transaction of referralTransactions) {
    if (transaction.markUp && transaction.referrerReward) {
      const markupAmount = transaction.markUp.amount;
      const baseCost = transaction.totalCost.dividedBy(markupAmount);
      const baseMarkupEarned = transaction.totalCost.minus(baseCost);
      const referralAmountRewarded = baseMarkupEarned.times(
        transaction.referrerReward.amount
      );

      totalEarnings += parseFloat(referralAmountRewarded.toString());
    }
  }

  return totalEarnings;
}

export async function calculateEarningsBreakdownForApp(
  appId: string
): Promise<EarningsBreakdown> {
  // Get all transactions for this app with all necessary relationships
  const transactions = await db.transaction.findMany({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    include: {
      markUp: true,
      referrerReward: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      transactionMetadata: true,
      referralCode: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let totalMarkupEarnings = 0;
  let totalMarkupBeforeReferral = 0;
  let totalReferralReduction = 0;
  let totalReferralEarnings = 0;
  let markupTransactionCount = 0;
  let referralTransactionCount = 0;

  // Track breakdowns
  const userBreakdown = new Map<
    string,
    {
      userId: string;
      userEmail: string;
      userName: string | null;
      markupEarnings: number;
      transactionCount: number;
    }
  >();

  const providerBreakdown = new Map<
    string,
    {
      provider: string;
      model: string;
      earnings: number;
      transactionCount: number;
      totalTokens: number;
    }
  >();

  const timeBreakdown = new Map<
    string,
    {
      period: string;
      earnings: number;
      transactionCount: number;
    }
  >();

  // Process each transaction
  for (const transaction of transactions) {
    let transactionEarnings = 0;
    const period = transaction.createdAt.toISOString().substring(0, 7); // YYYY-MM
    const providerKey = `${transaction.transactionMetadata?.provider || 'unknown'}-${transaction.transactionMetadata?.model || 'unknown'}`;

    // Calculate markup earnings if this transaction has markup
    if (transaction.markUp) {
      const markupAmount = transaction.markUp.amount;
      const baseCost = transaction.totalCost.dividedBy(markupAmount);
      const markupEarned = transaction.totalCost.minus(baseCost);

      let finalMarkupEarned = markupEarned;
      let referralReduction = 0;

      // Reduce by referrer reward if applicable
      if (transaction.referrerReward) {
        referralReduction = parseFloat(
          markupEarned.times(transaction.referrerReward.amount).toString()
        );
        finalMarkupEarned = markupEarned.minus(referralReduction);
      }

      const finalEarnings = parseFloat(finalMarkupEarned.toString());
      totalMarkupEarnings += finalEarnings;
      totalMarkupBeforeReferral += parseFloat(markupEarned.toString());
      totalReferralReduction += referralReduction;
      transactionEarnings += finalEarnings;
      markupTransactionCount++;

      // Update user breakdown
      const userId = transaction.user.id;
      if (!userBreakdown.has(userId)) {
        userBreakdown.set(userId, {
          userId,
          userEmail: transaction.user.email,
          userName: transaction.user.name,
          markupEarnings: 0,
          transactionCount: 0,
        });
      }
      const userEntry = userBreakdown.get(userId)!;
      userEntry.markupEarnings += finalEarnings;
      userEntry.transactionCount++;
    }

    // Check if this transaction generated referral earnings for the app owner
    // This happens when someone uses a referral code belonging to the app owner
    if (
      transaction.referralCode &&
      transaction.markUp &&
      transaction.referrerReward
    ) {
      const markupAmount = transaction.markUp.amount;
      const baseCost = transaction.totalCost.dividedBy(markupAmount);
      const baseMarkupEarned = transaction.totalCost.minus(baseCost);
      const referralAmountRewarded = parseFloat(
        baseMarkupEarned.times(transaction.referrerReward.amount).toString()
      );

      totalReferralEarnings += referralAmountRewarded;
      transactionEarnings += referralAmountRewarded;
      referralTransactionCount++;
    }

    // Update provider breakdown
    if (transaction.transactionMetadata && transactionEarnings > 0) {
      const metadata = transaction.transactionMetadata;
      if (!providerBreakdown.has(providerKey)) {
        providerBreakdown.set(providerKey, {
          provider: metadata.provider,
          model: metadata.model,
          earnings: 0,
          transactionCount: 0,
          totalTokens: 0,
        });
      }
      const providerEntry = providerBreakdown.get(providerKey)!;
      providerEntry.earnings += transactionEarnings;
      providerEntry.transactionCount++;
      providerEntry.totalTokens += metadata.totalTokens || 0;
    }

    // Update time breakdown
    if (transactionEarnings > 0) {
      if (!timeBreakdown.has(period)) {
        timeBreakdown.set(period, {
          period,
          earnings: 0,
          transactionCount: 0,
        });
      }
      const timeEntry = timeBreakdown.get(period)!;
      timeEntry.earnings += transactionEarnings;
      timeEntry.transactionCount++;
    }
  }

  const totalEarnings = totalMarkupEarnings + totalReferralEarnings;

  return {
    totalEarnings,
    markupEarnings: {
      total: totalMarkupEarnings,
      beforeReferralReduction: totalMarkupBeforeReferral,
      referralReduction: totalReferralReduction,
      transactionCount: markupTransactionCount,
    },
    referralEarnings: {
      total: totalReferralEarnings,
      transactionCount: referralTransactionCount,
    },
    breakdown: {
      byUser: Array.from(userBreakdown.values()).sort(
        (a, b) => b.markupEarnings - a.markupEarnings
      ),
      byProvider: Array.from(providerBreakdown.values()).sort(
        (a, b) => b.earnings - a.earnings
      ),
      byTimeRange: Array.from(timeBreakdown.values()).sort((a, b) =>
        a.period.localeCompare(b.period)
      ),
    },
  };
}

// export async function calculateGrossEarningsForApp(appId: string): Promise<number> {
//     return 0;
// }

// export async function calculateMarkupEarningsForApp(appId: string): Promise<number> {
//     return 0;
// }

// export async function calculateReferralEarningsForApp(appId: string): Promise<number> {
//     return 0;
// }
