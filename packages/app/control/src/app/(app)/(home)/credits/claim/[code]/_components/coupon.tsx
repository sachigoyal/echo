'use client';

import React from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import {
  CouponContainer,
  CouponHeader,
  CouponTitle,
  CouponDescription,
  CouponDivider,
  CouponFooter,
  CouponClaimButton,
  CouponValue,
  CouponLabel,
} from '@/components/coupon';

import { api } from '@/trpc/client';

interface Props {
  value: number;
  code: string;
}

export const ClaimCreditsCoupon: React.FC<Props> = ({ value, code }) => {
  const router = useRouter();

  const utils = api.useUtils();
  const {
    mutate: claimCredits,
    isPending: isClaiming,
    isSuccess: isClaimed,
  } = api.credits.grant.redeem.useMutation({
    onSuccess: () => {
      toast.success('Credits claimed');
      utils.user.balance.get.invalidate();
      setTimeout(() => {
        router.push('/credits');
      }, 2000);
    },
  });

  const handleClaim = () => {
    claimCredits({
      code,
    });
  };

  return (
    <CouponContainer>
      <CouponHeader>
        <CouponTitle>
          <CouponValue value={value} />
          <CouponLabel />
        </CouponTitle>
        <CouponDescription />
      </CouponHeader>
      <CouponDivider />
      <CouponFooter>
        <CouponClaimButton
          onClaim={handleClaim}
          isClaiming={isClaiming}
          isClaimed={isClaimed}
        />
      </CouponFooter>
    </CouponContainer>
  );
};
