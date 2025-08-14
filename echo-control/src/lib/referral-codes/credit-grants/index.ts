import { Prisma } from '@/generated/prisma';
import { db } from '@/lib/db';
import { CreditGrantReferralCode, ReferralCodeType } from '../types';
import { isGlobalAdmin } from '@/lib/admin';
import { mintCreditsToUser } from '@/lib/admin/mint-credits';

export async function mintCreditReferralCode(
  amountInDollars: number,
  expiresAt?: Date,
  tx?: Prisma.TransactionClient
): Promise<CreditGrantReferralCode> {
  const isAdmin = await isGlobalAdmin();

  if (!isAdmin) {
    throw new Error('Only admins can mint credit referral codes');
  }

  const code = crypto.randomUUID();

  const client = tx ?? db;

  // Set default expiration to 1 year from now if not provided
  const defaultExpiresAt =
    expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const referralCode = await client.referralCode.create({
    data: {
      code,
      echoAppId: null,
      grantType: ReferralCodeType.CREDITS,
      grantAmount: amountInDollars,
      reusable: false,
      expiresAt: defaultExpiresAt,
    },
  });

  return {
    code: referralCode.code,
    grantAmount: referralCode.grantAmount,
    expiresAt: referralCode.expiresAt,
  };
}

export async function redeemCreditReferralCode(
  userId: string,
  code: string,
  freeTier: boolean = false,
  echoAppId?: string
): Promise<{
  userId: string;
  amountInDollars: number;
  echoAppId: string | undefined;
  isFreeTier: boolean;
}> {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

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
      userId,
      Number(referralCode.grantAmount),
      { isFreeTier: freeTier, echoAppId },
      tx
    );

    return {
      userId: userIdFromMintCredits,
      amountInDollars,
      echoAppId: echoAppIdFromReferralCode,
      isFreeTier,
    };
  });
}
