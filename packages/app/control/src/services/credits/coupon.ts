import { db } from '@/lib/db';
import { ReferralCodeType } from '@/types/referral-code';
import { mintCreditsToUser } from './mint';
import z from 'zod';

import { EnumPaymentSource } from '@/generated/prisma';

export const getReferralCodeSchema = z.object({
  code: z.string(),
});

export const getReferralCode = async ({
  code,
}: z.infer<typeof getReferralCodeSchema>) => {
  const referralCode = await db.referralCode.findUnique({
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
    return null;
  }

  return {
    ...referralCode,
    grantAmount: Number(referralCode.grantAmount),
  };
};

export const redeemCreditReferralCodeSchema = getReferralCodeSchema.extend({
  freeTier: z.boolean().optional(),
  echoAppId: z.string().optional(),
});

export const redeemCreditReferralCode = async (
  userId: string,
  { code, freeTier, echoAppId }: z.infer<typeof redeemCreditReferralCodeSchema>
) => {
  const referralCode = await getReferralCode({ code });

  if (!referralCode) {
    throw new Error('Referral code not found or expired');
  }

  if (!referralCode.grantAmount) {
    throw new Error('Referral code has no grant amount');
  }

  return await db.$transaction(async tx => {
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
