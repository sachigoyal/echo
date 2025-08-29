'use client';

import z from 'zod';

import { useForm } from 'react-hook-form';

import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PercentInput } from '@/components/ui/percent-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

import { setAppReferralRewardSchema } from '@/services/apps/referral-codes';

import { zodResolver } from '@hookform/resolvers/zod';

import { api } from '@/trpc/client';

interface Props {
  appId: string;
  onSuccess: () => void;
}

export const UpdateReferralBonus: React.FC<Props> = ({ appId, onSuccess }) => {
  const utils = api.useUtils();

  const form = useForm<z.infer<typeof setAppReferralRewardSchema>>({
    resolver: zodResolver(setAppReferralRewardSchema),
    defaultValues: {
      percentage: undefined,
    },
    mode: 'onChange',
  });

  const {
    mutate: updateReferralBonus,
    isPending,
    isSuccess,
  } = api.apps.app.referralReward.set.useMutation({
    onSuccess: () => {
      utils.apps.app.referralReward.get.invalidate(appId);
      onSuccess();
    },
  });

  const handleSubmit = (data: z.infer<typeof setAppReferralRewardSchema>) => {
    updateReferralBonus({ appId, percentage: data.percentage });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="flex flex-col w-full gap-4">
          <FormField
            control={form.control}
            name="percentage"
            render={({ field: { onChange } }) => (
              <FormItem>
                <FormControl>
                  <PercentInput
                    setAmount={onChange}
                    placeholder="20"
                    className="w-full text-right"
                    min="0.01"
                    max="100"
                    step="0.01"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={
              isPending ||
              !form.formState.isValid ||
              isSuccess ||
              !form.formState.isDirty
            }
            size="lg"
            variant="turbo"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isSuccess ? (
              <Check className="size-4" />
            ) : (
              'Set Referral Bonus'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
