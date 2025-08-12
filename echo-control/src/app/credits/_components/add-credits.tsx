'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';

import { createPaymentLink } from '../_actions/create-payment-link';
import { Loader2 } from 'lucide-react';

export const AddCredits = () => {
  const [amount, setAmount] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCredits = async () => {
    setIsLoading(true);
    try {
      await createPaymentLink({ amount: Number(amount) });
    } catch (error) {
      console.error('Error creating payment link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-2">
      <MoneyInput
        setAmount={setAmount}
        placeholder="0.00"
        className="w-full text-right"
        min="1"
        step="0.01"
      />
      <Button
        onClick={handleAddCredits}
        disabled={isLoading || !amount || amount <= 0}
        size="lg"
        variant="turbo"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          'Add Credits'
        )}
      </Button>
    </div>
  );
};
