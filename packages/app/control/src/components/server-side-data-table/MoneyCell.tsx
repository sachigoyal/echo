import React from 'react';

interface MoneyCellProps {
  amount: number | string | null | undefined;
  decimals?: number;
  currency?: string;
  className?: string;
}

export function MoneyCell({
  amount,
  decimals = 2,
  currency = '$',
  className = '',
}: MoneyCellProps) {
  if (amount === null || amount === undefined) {
    return <span className="text-gray-400 italic">No amount</span>;
  }

  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  const formattedAmount = `${currency}${numericAmount.toFixed(decimals)}`;

  return (
    <span className={`font-mono text-sm font-medium ${className}`}>
      {formattedAmount}
    </span>
  );
}
