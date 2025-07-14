'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  CreditCardIcon,
  PlusIcon,
  MinusIcon,
  ArrowUpRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassButton } from './glass-button';
import { formatCurrency } from '@/lib/balance';
import { Logo } from './ui/logo';

interface Balance {
  balance: string;
  totalPaid: string;
  totalSpent: string;
  currency: string;
}

interface BalanceCardProps {
  compact?: boolean;
}

export default function BalanceCard({ compact = false }: BalanceCardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<
    'increment' | 'decrement'
  >('increment');

  useEffect(() => {
    if (isLoaded && user) {
      fetchBalance();
    }
  }, [isLoaded, user]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/balance');
      const data = await response.json();
      setBalance(data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!adjustmentAmount || isNaN(Number(adjustmentAmount))) return;

    try {
      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(adjustmentAmount),
          operation: adjustmentType,
          description: `Manual ${adjustmentType} of $${adjustmentAmount}`,
        }),
      });

      if (response.ok) {
        await fetchBalance();
        setAdjustmentAmount('');
      }
    } catch (error) {
      console.error('Error adjusting balance:', error);
    }
  };

  const handleNavigateToCredits = () => {
    router.push('/credits');
  };

  if (!isLoaded || loading) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2 animate-pulse">
          <div className="h-6 w-6 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      );
    }

    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Compact version for header
  if (compact) {
    return (
      <button
        onClick={handleNavigateToCredits}
        className="flex items-center space-x-2 px-3 py-2.5 rounded-lg bg-background border border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-200 shadow-sm group h-10"
        title="View and manage credits"
      >
        <Logo className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
        <span className="text-sm font-medium text-foreground">
          {formatCurrency(Number(balance?.balance) || 0)}
        </span>
        <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-secondary transition-colors" />
      </button>
    );
  }

  // Full version for standalone use
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Overall Account Balance
        </h3>
        <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
      </div>

      {balance && (
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold text-secondary">
              ${balance.balance}
            </div>
            <div className="text-sm text-muted-foreground">
              Total available balance across all apps
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <div className="text-sm text-muted-foreground">Total Credits</div>
              <div className="font-semibold text-secondary">
                +${balance.totalPaid}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <div className="font-semibold text-destructive">
                {formatCurrency(Number(balance.totalSpent))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                💡 To add credits, visit any of your individual app pages where
                you can purchase credits specific to that app.
              </p>
            </div>
          </div>

          {/* Admin Balance Controls */}
          <div className="border-t border-border pt-4">
            <div className="text-sm font-medium text-card-foreground mb-2">
              Admin Controls:
            </div>
            <div className="flex space-x-2">
              <select
                value={adjustmentType}
                onChange={e =>
                  setAdjustmentType(e.target.value as 'increment' | 'decrement')
                }
                className="text-sm border border-input bg-input text-input-foreground rounded px-2 py-1"
              >
                <option value="increment">Add</option>
                <option value="decrement">Remove</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={adjustmentAmount}
                onChange={e => setAdjustmentAmount(e.target.value)}
                placeholder="Amount"
                className="flex-1 text-sm border border-input bg-input text-input-foreground rounded px-2 py-1 placeholder-muted-foreground"
              />
              <GlassButton
                onClick={handleBalanceAdjustment}
                disabled={!adjustmentAmount}
                variant="secondary"
                className="!h-8 !w-10"
              >
                {adjustmentType === 'increment' ? (
                  <PlusIcon className="h-4 w-4" />
                ) : (
                  <MinusIcon className="h-4 w-4" />
                )}
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
