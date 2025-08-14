import { ReferralCode } from '@/generated/prisma';

export type CreditGrantReferralCode = Pick<
  ReferralCode,
  'code' | 'grantAmount' | 'expiresAt'
>;

export type UserReferralCode = Pick<
  ReferralCode,
  'code' | 'expiresAt' | 'userId' | 'echoAppId'
>;

export enum ReferralCodeType {
  CREDITS = 'credits',
  REFERRAL = 'referral',
}
