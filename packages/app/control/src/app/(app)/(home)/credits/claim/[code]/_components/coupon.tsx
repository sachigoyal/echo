'use client';

import React from 'react';

import { ArrowLeft } from 'lucide-react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
  CouponMarquee,
} from '@/components/coupon';

import { api } from '@/trpc/client';

interface Props {
  value: number;
  code: string;
  canUse: boolean;
}

export const ClaimCreditsCoupon: React.FC<Props> = ({
  value,
  code,
  canUse,
}) => {
  const router = useRouter();

  const utils = api.useUtils();
  const {
    mutate: claimCredits,
    isPending: isClaiming,
    isSuccess: isClaimed,
  } = api.credits.grant.redeem.useMutation({
    onSuccess: () => {
      toast.success('Credits claimed');
      void utils.user.balance.get.invalidate();
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
    <div className="flex flex-col items-center gap-4 w-full">
      <CouponContainer>
        <CouponHeader>
          <CouponTitle>
            <CouponValue value={value} />
            <CouponLabel />
          </CouponTitle>
          <CouponDescription />
        </CouponHeader>
        <CouponMarquee size={36} />
        <CouponDivider />
        <CouponFooter>
          {canUse ? (
            <CouponClaimButton
              onClaim={handleClaim}
              isClaiming={isClaiming}
              isClaimed={isClaimed}
            />
          ) : (
            <Link href="/credits">
              <Button
                variant="unstyled"
                className="rounded-xl bg-white text-black h-12 md:h-12 w-full"
              >
                <ArrowLeft className="size-4" />
                Back to Credits
              </Button>
            </Link>
          )}
        </CouponFooter>
      </CouponContainer>
      {!canUse && (
        <p className="text-sm text-muted-foreground">
          You have already claimed this coupon.
        </p>
      )}
    </div>
  );
};

export const LoadingCoupon = () => {
  return (
    <CouponContainer className="w-full">
      <CouponHeader>
        <CouponTitle>
          <div className="opacity-50">
            <Skeleton className="w-24 h-12" />
          </div>
          <CouponLabel />
        </CouponTitle>
        <CouponDescription />
      </CouponHeader>
      <CouponMarquee size={36} />
      <CouponDivider />
      <CouponFooter className="opacity-50">
        <Skeleton className="w-full h-12 rounded-xl" />
      </CouponFooter>
    </CouponContainer>
  );
};
