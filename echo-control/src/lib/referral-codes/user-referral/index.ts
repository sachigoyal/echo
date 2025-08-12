import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ReferralReward } from '@/generated/prisma';
import { Prisma } from '@/generated/prisma';

export async function setAppReferralReward(
  echoAppId: string,
  reward: number
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('User not found');
  }

  await db.$transaction(async tx => {
    const echoApp = await db.echoApp.findUnique({
      where: {
        id: echoAppId,
        appMemberships: {
          some: {
            userId: user.id,
            role: {
              equals: 'owner',
            },
          },
        },
      },
    });

    if (!echoApp) {
      throw new Error('EchoApp not found');
    }

    // Create a new referral reward record
    const newReferralReward = await tx.referralReward.create({
      data: {
        echoAppId: echoAppId,
        amount: reward,
        description: 'App referral reward',
        isArchived: false,
      },
    });

    // Update the EchoApp to reference this new reward as the current one
    await tx.echoApp.update({
      where: { id: echoAppId },
      data: {
        currentReferralRewardId: newReferralReward.id,
      },
    });
  });
}

export async function getCurrentReferralReward(
  echoAppId: string,
  tx?: Prisma.TransactionClient
): Promise<ReferralReward | null> {
  const client = tx ?? db;

  const echoApp = await client.echoApp.findUnique({
    where: { id: echoAppId },
    include: {
      currentReferralReward: true,
    },
  });

  if (!echoApp) {
    throw new Error('EchoApp not found');
  }

  return echoApp.currentReferralReward ?? null;
}
