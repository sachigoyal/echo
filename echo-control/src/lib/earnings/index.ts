import { db } from '@/lib/db';
import { getAllOwnerEchoApps } from '@/lib/apps';

export async function calculateGrossEarningsForApp(
  appId: string
): Promise<number> {
  const result = await db.transaction.aggregate({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    _sum: {
      totalCost: true,
    },
  });

  // Convert Decimal to number, handling null case
  return result._sum.totalCost ? Number(result._sum.totalCost) : 0;
}

export async function calculateMarkupEarningsForApp(
  appId: string
): Promise<number> {
  const result = await db.transaction.aggregate({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    _sum: {
      markUpProfit: true,
    },
  });

  // Convert Decimal to number, handling null case
  return result._sum.markUpProfit ? Number(result._sum.markUpProfit) : 0;
}

export async function calculateReferralEarningsForApp(
  appId: string
): Promise<Record<string, number>> {
  const transactions = await db.transaction.findMany({
    where: {
      echoAppId: appId,
      isArchived: false,
      referralCodeId: {
        not: null,
      },
    },
    select: {
      referralProfit: true,
      referralCode: {
        select: {
          userId: true,
        },
      },
    },
  });

  const userEarnings: Record<string, number> = {};

  for (const transaction of transactions) {
    if (transaction.referralCode?.userId) {
      const userId = transaction.referralCode.userId;
      const profit = Number(transaction.referralProfit);

      if (userEarnings[userId]) {
        userEarnings[userId] += profit;
      } else {
        userEarnings[userId] = profit;
      }
    }
  }

  return userEarnings;
}

// Types for the earnings breakdown
export interface AppEarningsBreakdown {
  appId: string;
  appName: string;
  grossEarnings: number;
  markupEarnings: number;
  referralEarnings: Record<string, number>;
  totalReferralEarnings: number;
}

export interface UserEarningsSummary {
  totalGrossEarnings: number;
  totalMarkupEarnings: number;
  totalReferralEarnings: number;
  appsBreakdown: AppEarningsBreakdown[];
}

// Calculate total earnings across all apps owned by a user
export async function calculateEarningsForUser(
  userId: string
): Promise<UserEarningsSummary> {
  const ownerApps = await getAllOwnerEchoApps(userId);

  const appsBreakdown: AppEarningsBreakdown[] = [];
  let totalGrossEarnings = 0;
  let totalMarkupEarnings = 0;
  let totalReferralEarnings = 0;

  for (const app of ownerApps) {
    const breakdown = await calculateEarningsBreakdownForApp(app.id);
    appsBreakdown.push(breakdown);

    totalGrossEarnings += breakdown.grossEarnings;
    totalMarkupEarnings += breakdown.markupEarnings;
    totalReferralEarnings += breakdown.totalReferralEarnings;
  }

  return {
    totalGrossEarnings,
    totalMarkupEarnings,
    totalReferralEarnings,
    appsBreakdown,
  };
}

// Calculate detailed earnings breakdown for a single app
export async function calculateEarningsBreakdownForApp(
  appId: string
): Promise<AppEarningsBreakdown> {
  // Get app name
  const app = await db.echoApp.findUnique({
    where: { id: appId },
    select: { name: true },
  });

  if (!app) {
    throw new Error(`App with id ${appId} not found`);
  }

  // Calculate all earnings types in parallel for efficiency
  const [grossEarnings, markupEarnings, referralEarnings] = await Promise.all([
    calculateGrossEarningsForApp(appId),
    calculateMarkupEarningsForApp(appId),
    calculateReferralEarningsForApp(appId),
  ]);

  // Calculate total referral earnings
  const totalReferralEarnings = Object.values(referralEarnings).reduce(
    (sum, amount) => sum + amount,
    0
  );

  return {
    appId,
    appName: app.name,
    grossEarnings,
    markupEarnings,
    referralEarnings,
    totalReferralEarnings,
  };
}
