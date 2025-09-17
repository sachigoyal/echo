'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';

import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { api } from '@/trpc/client';

export const AddCredits = () => {
  const [amount, setAmount] = useState<number>();
  const [error, setError] = useState<string | null>(null);

  const {
    mutate: createPaymentLink,
    isPending,
    isSuccess,
  } = api.user.payments.create.useMutation({
    onSuccess: data => {
      window.location.href = data.paymentLink.url;
    },
    onError: error => {
      setError(error.message || 'Failed to create payment link');
    },
  });

  const onAddCredits = () => {
    if (!amount) {
      throw new Error('Amount is required');
    }
    createPaymentLink({ amount });
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <MoneyInput
        setAmount={setAmount}
        placeholder="0.00"
        className="w-full text-right"
        min="1"
        step="0.01"
      />
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="size-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button
        onClick={onAddCredits}
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
