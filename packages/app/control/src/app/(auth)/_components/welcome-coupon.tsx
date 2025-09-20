'use client';

import {
  CouponClaimButton,
  CouponContainer,
  CouponDescription,
  CouponDivider,
  CouponFooter,
  CouponHeader,
  CouponLabel,
  CouponMarquee,
  CouponTitle,
  CouponValue,
} from '@/components/coupon';
import type { STATES } from '@/components/coupon/multi-state-button';
import { api } from '@/trpc/client';
import { toast } from 'sonner';

interface Props {
  amount: number;
  onSuccess: () => void;
  hasClaimedFreeTier?: boolean;
  code?: string;
  states?: STATES;
  subText?: React.ReactNode;
}

export const WelcomeCoupon: React.FC<Props> = ({
  amount,
  onSuccess,
  hasClaimedFreeTier,
  code,
  states,
  subText,
}) => {
  const utils = api.useUtils();

  const {
    mutateAsync: signPrivacy,
    isPending: isSigningPrivacy,
    isSuccess: isSignedPrivacy,
  } = api.user.legal.accept.privacy.useMutation({
    onSuccess: () => {
      void utils.user.legal.needs.privacy.invalidate();
    },
    onError: () => {
      toast.error('Failed to accept privacy policy');
    },
  });

  const {
    mutateAsync: signTerms,
    isPending: isSigningTerms,
    isSuccess: isSignedTerms,
  } = api.user.legal.accept.terms.useMutation({
    onSuccess: () => {
      void utils.user.legal.needs.terms.invalidate();
    },
    onError: () => {
      toast.error('Failed to accept terms');
    },
  });

  const {
    mutateAsync: redeemCreditGrant,
    isPending: isRedeemingCreditGrant,
    isSuccess: isRedeemCreditGrantSuccess,
  } = api.credits.grant.redeem.useMutation();

  const {
    mutateAsync: claimInitialFreeTier,
    isPending: isClaimingCoupon,
    isSuccess: isClaimedCoupon,
  } = api.user.initialFreeTier.issue.useMutation({
    onSuccess: () => {
      void utils.user.initialFreeTier.hasClaimed.invalidate();
      toast.success('Credits Claimed!');
    },
    onError: () => {
      toast.error('Failed to claim credits');
    },
  });

  const onClaim = async () => {
    await Promise.all([signTerms(), signPrivacy()]);
    await Promise.all([
      !hasClaimedFreeTier ? claimInitialFreeTier() : Promise.resolve(),
      code ? redeemCreditGrant({ code }) : Promise.resolve(),
    ]);
    setTimeout(() => {
      onSuccess();
    }, 500);
  };

  return (
    <CouponContainer>
      <CouponHeader className="pb-2">
        <CouponTitle>
          <CouponValue value={amount} />
          <CouponLabel />
        </CouponTitle>
        <CouponDescription>{subText}</CouponDescription>
      </CouponHeader>
      <CouponMarquee size={36} />
      <CouponDivider />
      <CouponFooter>
        <CouponClaimButton
          onClaim={onClaim}
          isClaiming={
            isClaimingCoupon ||
            isSigningTerms ||
            isSigningPrivacy ||
            (code ? isRedeemingCreditGrant : false)
          }
          isClaimed={
            isClaimedCoupon &&
            isSignedTerms &&
            isSignedPrivacy &&
            (code ? isRedeemCreditGrantSuccess : true)
          }
          states={states}
        />
      </CouponFooter>
    </CouponContainer>
  );
};
