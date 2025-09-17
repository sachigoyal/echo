import { db } from '@/lib/db';
import { mintCreditsToUser } from '@/services/credits';
import { EnumPaymentSource } from '@/generated/prisma';
import z from 'zod';

export const redeemCreditGrantCodeSchema = z.object({
  code: z.string(),
  freeTier: z.boolean().optional(),
  echoAppId: z.string().optional(),
});

export const redeemCreditGrantCode = async (
  userId: string,
  { code, freeTier, echoAppId }: z.infer<typeof redeemCreditGrantCodeSchema>
) => {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return await db.$transaction(async tx => {
    const creditGrantCode = await tx.creditGrantCode.findUnique({
      where: {
        code,
        expiresAt: { gt: new Date() },
        isArchived: false,
      },
      include: {
        usages: {
          where: {
            userId,
          },
        },
      },
    });
    if (!creditGrantCode) {
      throw new Error('Referral code not found or expired');
    }

    if (
      creditGrantCode.maxUses &&
      creditGrantCode.maxUses <= creditGrantCode.uses
    ) {
      throw new Error(
        'Credit grant code has reached the maximum number of uses'
      );
    }

    if (
      creditGrantCode.maxUsesPerUser &&
      creditGrantCode.maxUsesPerUser <= creditGrantCode.usages.length
    ) {
      throw new Error(
        'Credit grant code has reached the maximum number of uses per user'
      );
    }

    await tx.creditGrantCode.update({
      where: { id: creditGrantCode.id },
      data: { uses: creditGrantCode.uses + 1 },
    });

    await tx.creditGrantCodeUsage.create({
      data: {
        userId,
        creditGrantCodeId: creditGrantCode.id,
        grantedAmount: Number(creditGrantCode.grantAmount),
      },
    });

    const {
      userId: userIdFromMintCredits,
      amountInDollars,
      echoAppId: echoAppIdFromReferralCode,
      isFreeTier,
    } = await mintCreditsToUser(
      {
        userId,
        amountInDollars: Number(creditGrantCode.grantAmount),
        options: {
          isFreeTier: freeTier,
          echoAppId,
          source: EnumPaymentSource.admin,
        },
      },
      tx
    );

    return {
      userId: userIdFromMintCredits,
      amountInDollars,
      echoAppId: echoAppIdFromReferralCode,
      isFreeTier,
    };
  });
};
