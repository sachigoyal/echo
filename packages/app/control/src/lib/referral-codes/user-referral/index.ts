import { db } from '@/lib/db';
import { ReferralCodeType } from '../types';

export async function setUserReferrerForAppIfExists(
  userId: string,
  echoAppId: string,
  code: string
): Promise<boolean> {
  const appMembership = await db.appMembership.findUnique({
    where: {
      userId_echoAppId: {
        userId,
        echoAppId,
      },
    },
    select: {
      referrerId: true,
    },
  });

  if (appMembership?.referrerId) {
    // If the user already has a referrer, return false
    return false;
  }

  const referralCode = await db.referralCode.findUnique({
    where: {
      code,
      grantType: ReferralCodeType.REFERRAL,
      echoAppId: echoAppId,
    },
  });

  if (!referralCode) {
    return false;
  }

  await db.appMembership.update({
    where: {
      userId_echoAppId: {
        userId,
        echoAppId,
      },
    },
    data: {
      referrerId: referralCode.id,
    },
  });

  await db.referralCode.update({
    where: { id: referralCode.id },
    data: {
      usedAt: new Date(),
    },
  });

  return true;
}
