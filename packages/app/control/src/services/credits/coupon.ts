import { db } from '@/lib/db';
import { ReferralCodeType } from '../types';
import { mintCreditsToUser } from '@/services/credits/mint';
import { EnumPaymentSource } from '@/generated/prisma';
import z from 'zod';
import { getUser } from '@/services/user/get';

export const redeemCreditReferralCodeSchema = z.object({
  code: z.string(),
  freeTier: z.boolean().optional(),
  echoAppId: z.string().optional(),
});

export const redeemCreditReferralCode = async (
  userId: string,
  { code, freeTier, echoAppId }: z.infer<typeof redeemCreditReferralCodeSchema>
) => {
  const user = await getUser(userId);

  if (!user) {
    throw new Error('User not found');
  }

  return await db.$transaction(async tx => {
    const referralCode = await tx.referralCode.findUnique({
      where: {
        code,
        expiresAt: { gt: new Date() },
        isUsed: false,
        isArchived: false,
        grantType: ReferralCodeType.CREDITS,
        grantAmount: { not: null },
      },
    });

    if (!referralCode) {
      throw new Error('Referral code not found or expired');
    }

    if (!referralCode.grantAmount) {
      throw new Error('Referral code has no grant amount');
    }

    await tx.referralCode.update({
      where: { id: referralCode.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    const {
      userId: userIdFromMintCredits,
      amountInDollars,
      echoAppId: echoAppIdFromReferralCode,
      isFreeTier,
    } = await mintCreditsToUser(
      {
        userId,
        amountInDollars: Number(referralCode.grantAmount),
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
