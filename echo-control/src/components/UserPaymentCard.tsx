'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { GlassButton } from './glass-button';
import { formatCurrency } from '@/lib/balance';

interface UserBalance {
  balance: number;
  totalPaid: number;
  totalSpent: number;
  currency: string;
}

const CREDIT_PACKAGES = [
  { amount: 10, price: 10, popular: false },
  { amount: 25, price: 25, popular: true },
  { amount: 50, price: 50, popular: false },
  { amount: 100, price: 100, popular: false },
];

export default function UserPaymentCard() {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]); // Default to popular option

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      // Fetch user's overall balance (no echoAppId to get total across all apps)
      const response = await fetch('/api/balance');
      const data = await response.json();

      if (response.ok) {
        setBalance(data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handlePurchaseCredits = async (amount: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: `Echo Account Credits`,
          successUrl: `${window.location.origin}/`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      if (data.paymentLink?.url) {
        // Navigate to Stripe payment page
        window.location.href = data.paymentLink.url;
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert(
        `Error: ${error instanceof Error ? error.message : 'Failed to create payment link'}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (balanceLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-zinc-300 dark:bg-zinc-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="lg:w-1/3">
          <div className="flex items-center justify-between lg:flex-col lg:items-start">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-secondary" />
                Credits
              </h3>
              {balance && (
                <>
                  <p className="text-3xl font-bold text-secondary mt-2">
                    ${balance.balance.toFixed(2)}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Available across all apps
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Balance Details */}
          {balance && (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
              <div>
                <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Total Credits
                </div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  +${balance.totalPaid.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Total Spent
                </div>
                <div className="font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  {formatCurrency(balance.totalSpent)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Credit Packages */}
        <div className="lg:w-2/3">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Purchase credits:
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {CREDIT_PACKAGES.map(pkg => (
                <button
                  key={pkg.amount}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-sm ${
                    selectedPackage.amount === pkg.amount
                      ? 'border-secondary bg-secondary/5 shadow-sm ring-1 ring-secondary/20'
                      : 'border-border bg-zinc-50 dark:bg-zinc-900/50 hover:border-secondary/50 hover:bg-secondary/5'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-secondary text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        ${pkg.amount}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        credits
                      </div>
                    </div>
                    <DollarSign className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                    Pay ${pkg.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <GlassButton
            onClick={() => handlePurchaseCredits(selectedPackage.amount)}
            disabled={loading}
            variant="secondary"
            className="mt-6 w-full flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase ${selectedPackage.amount} Credits
              </>
            )}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
