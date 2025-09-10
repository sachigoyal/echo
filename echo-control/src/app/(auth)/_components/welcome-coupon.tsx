'use client';

import { Coupon } from '@/components/coupon';
import { STATES } from '@/components/coupon/multi-state-button';
import { api } from '@/trpc/client';
import { toast } from 'sonner';

interface Props {
  amount: number;
  onSuccess: () => void;
  states?: STATES;
  subText?: React.ReactNode;
}

export const WelcomeCoupon: React.FC<Props> = ({
  amount,
  onSuccess,
  states,
  subText,
}) => {
  const utils = api.useUtils();

  const {
    mutate: signTerms,
    isPending: isSigningTerms,
    isSuccess: isSignedTerms,
  } = api.user.termsAgreement.accept.terms.useMutation({
    onError: () => {
      toast.error('Failed to accept terms');
      utils.user.termsAgreement.needs.terms.invalidate();
    },
  });

  const {
    mutate: claimCoupon,
    isPending: isClaimingCoupon,
    isSuccess: isClaimedCoupon,
  } = api.user.initialFreeTier.issue.useMutation({
    onSuccess: () => {
      utils.user.initialFreeTier.hasClaimed.invalidate();
      setTimeout(() => {
        toast.success('Credits claimed');
        onSuccess();
      }, 500);
    },
    onError: () => {
      toast.error('Failed to claim credits');
    },
  });

  return (
    <Coupon
      value={amount}
      onClaim={() =>
        signTerms(void 0, {
          onSuccess: () => {
            claimCoupon();
          },
        })
      }
      isClaiming={isClaimingCoupon || isSigningTerms}
      isClaimed={isClaimedCoupon && isSignedTerms}
      states={states}
      subText={subText}
    />
  );
};
