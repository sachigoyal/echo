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
import { STATES } from '@/components/coupon/multi-state-button';
import { api } from '@/trpc/client';
import { toast } from 'sonner';

interface Props {
  amount: number;
  onSuccess: () => void;
  code?: string;
  states?: STATES;
  subText?: React.ReactNode;
}

export const WelcomeCoupon: React.FC<Props> = ({
  amount,
  onSuccess,
  code,
  states,
  subText,
}) => {
  const utils = api.useUtils();

  const {
    mutate: redeemCreditGrant,
    isPending: isRedeemingCreditGrant,
    isSuccess: isRedeemCreditGrantSuccess,
  } = api.credits.grant.redeem.useMutation();

  const {
    mutate: claimInitialFreeTier,
    isPending: isClaimingCoupon,
    isSuccess: isClaimedCoupon,
  } = api.user.initialFreeTier.issue.useMutation({
    onSuccess: () => {
      utils.user.initialFreeTier.hasClaimed.invalidate();
      setTimeout(() => {
        toast.success('Credits Claimed!');
        onSuccess();
      }, 500);
    },
    onError: () => {
      toast.error('Failed to claim credits');
    },
  });

  const {
    mutate: signPrivacy,
    isPending: isSigningPrivacy,
    isSuccess: isSignedPrivacy,
  } = api.user.legal.accept.privacy.useMutation({
    onSuccess: () => {
      utils.user.legal.needs.privacy.invalidate();
    },
    onError: () => {
      toast.error('Failed to accept privacy policy');
    },
  });

  const {
    mutate: signTerms,
    isPending: isSigningTerms,
    isSuccess: isSignedTerms,
  } = api.user.legal.accept.terms.useMutation({
    onSuccess: () => {
      utils.user.legal.needs.terms.invalidate();
    },
    onError: () => {
      toast.error('Failed to accept terms');
    },
  });

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
          onClaim={() =>
            signTerms(void 0, {
              onSuccess: () => {
                signPrivacy(void 0, {
                  onSuccess: () =>
                    claimInitialFreeTier(void 0, {
                      onSuccess: () => {
                        if (code) {
                          redeemCreditGrant(
                            { code },
                            { onSuccess: () => onSuccess() }
                          );
                        } else {
                          onSuccess();
                        }
                      },
                    }),
                });
              },
            })
          }
          isClaiming={
            isClaimingCoupon ||
            isSigningTerms ||
            isSigningPrivacy ||
            (code ? isRedeemingCreditGrant : false)
          }
          isClaimed={
            (isClaimedCoupon && isSignedTerms && isSignedPrivacy) ||
            (code ? isRedeemCreditGrantSuccess : false)
          }
          states={states}
        />
      </CouponFooter>
    </CouponContainer>
  );
};
