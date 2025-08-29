'use client';

import { Pencil } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { api } from '@/trpc/client';

import { cn } from '@/lib/utils';
import { UpdateReferralBonus } from './update-form';
import { useState } from 'react';

interface Props {
  appId: string;
}

export const ReferralBonusAmount: React.FC<Props> = ({ appId }) => {
  const [referralReward] =
    api.apps.app.referralReward.get.useSuspenseQuery(appId);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 ">
      <h2
        className={cn(
          'flex items-center gap-4 text-3xl font-bold',
          referralReward ? 'text-foreground' : 'text-foreground/60'
        )}
      >
        {referralReward
          ? (referralReward.amount - 1).toLocaleString(undefined, {
              style: 'percent',
              maximumFractionDigits: 2,
            })
          : 'No Referral Bonus'}
      </h2>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" />
            {referralReward ? 'Update' : 'Set'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {referralReward ? 'Update' : 'Set'} Referral Bonus
            </DialogTitle>
            <DialogDescription>
              This is the % of revenue that will be allocated to users who refer
              new users.
            </DialogDescription>
          </DialogHeader>
          <UpdateReferralBonus
            appId={appId}
            onSuccess={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const ReferralBonusAmountSkeleton = () => {
  return <Skeleton className="w-24 h-9" />;
};
