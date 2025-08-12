import { ReferralCode } from '@/generated/prisma';

export type CreditGrantReferralCode = Pick<
  ReferralCode,
  'code' | 'grantAmount' | 'expiresAt'
>;

export enum ReferralCodeType {
  CREDITS = 'credits',
  REFERRAL = 'referral',
}
