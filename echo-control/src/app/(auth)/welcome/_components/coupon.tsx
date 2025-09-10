'use client';

import Coupon from '@/components/coupon';
import { api } from '@/trpc/client';
import { Route } from 'next';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  amount: number;
  callbackUrl: Route;
}

export const WelcomeCoupon = ({ amount, callbackUrl }: Props) => {
  const router = useRouter();

  const {
    mutate: signTerms,
    isPending: isSigningTerms,
    isSuccess: isSignedTerms,
  } = api.user.termsAgreement.accept.terms.useMutation({
    onError: () => {
      toast.error('Failed to accept terms');
    },
  });

  const {
    mutate: claimCoupon,
    isPending: isClaimingCoupon,
    isSuccess: isClaimedCoupon,
  } = api.user.initialFreeTier.issue.useMutation({
    onSuccess: () => {
      setTimeout(() => {
        toast.success('Credits claimed');
        router.push(callbackUrl);
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
    />
  );
};
