'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';

import { createPaymentLink } from '../_actions/create-payment-link';
import { Check, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export const AddCredits = () => {
  const [amount, setAmount] = useState<number>();

  const {
    mutate: onAddCredits,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: () => {
      if (!amount) {
        throw new Error('Amount is required');
      }
      return createPaymentLink({ amount });
    },
  });

  return (
    <div className="flex flex-col w-full gap-4">
      <MoneyInput
        setAmount={setAmount}
        placeholder="0.00"
        className="w-full text-right"
        min="1"
        step="0.01"
      />
      <Button
        onClick={() => onAddCredits()}
        disabled={isPending || !amount || amount <= 0 || isSuccess}
        size="lg"
        variant="turbo"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isSuccess ? (
          <Check className="size-4" />
        ) : (
          'Add Credits'
        )}
      </Button>
    </div>
  );
};
