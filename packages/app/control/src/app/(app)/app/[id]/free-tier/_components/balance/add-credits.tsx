'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';

import { Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/trpc/client';

interface Props {
  appId: string;
}

export const AddCredits: React.FC<Props> = ({ appId }) => {
  const [amount, setAmount] = useState<number>();
  const [error, setError] = useState<string | null>(null);
  const [isSuccessFromBalance, setIsSuccessFromBalance] =
    useState<boolean>(false);

  const utils = api.useUtils();

  const {
    mutate: createPaymentLink,
    isPending,
    isSuccess,
  } = api.apps.app.freeTier.payments.create.useMutation({
    onSuccess: data => {
      setError(null);
      window.location.href = data.paymentLink.url;
    },
    onError: error => {
      setError(error.message || 'Failed to create payment link');
    },
  });

  const {
    mutate: createPaymentFromBalance,
    isPending: isPendingFromBalance,
    error: balancePaymentError,
  } = api.apps.app.freeTier.payments.createFromBalance.useMutation({
    onSuccess: data => {
      if (!data.success) {
        setError(data.error_message || 'Payment failed');
        return;
      }
      setError(null);
      setIsSuccessFromBalance(true);

      // Invalidate balance queries
      utils.user.balance.get.invalidate();
      utils.user.balance.app.free.invalidate({ appId });
      utils.apps.app.freeTier.get.invalidate({ appId });
    },
    onError: error => {
      setError(error.message || 'Failed to process payment from balance');
    },
  });

  const onAddCredits = () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError(null);
    createPaymentLink({ appId, amount });
  };

  const onAddCreditsFromBalance = () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setError(null);
    createPaymentFromBalance({ appId, amountInDollars: amount });
  };

  const [currentUserBalance] = api.user.balance.get.useSuspenseQuery();

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

      <div className="flex gap-3">
        <Button
          onClick={onAddCredits}
          disabled={isPending || !amount || amount < 1 || isSuccess}
          size="lg"
          variant="turboSecondary"
          className="flex-1"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="size-4" />
          ) : (
            'Add Credits'
          )}
        </Button>
        <Button
          onClick={onAddCreditsFromBalance}
          disabled={
            isPendingFromBalance ||
            !amount ||
            amount < 0 ||
            isSuccessFromBalance ||
            currentUserBalance.balance < amount
          }
          size="lg"
          variant="turbo"
          className="flex-1"
        >
          {isPendingFromBalance ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isSuccessFromBalance && !balancePaymentError ? (
            <Check className="size-4" />
          ) : (
            'Add Credits From Balance'
          )}
        </Button>
      </div>
    </div>
  );
};
