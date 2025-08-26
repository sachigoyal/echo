'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SpendPoolData } from '@/lib/spend-pools/types';
import SpendLimitModal from './SpendLimitModal';
import { api } from '@/trpc/client';

interface FreeTierCreditsSettingsProps {
  appId: string;
}

interface PoolData {
  totalBalance: number;
}

export default function FreeTierCreditsSettings({
  appId,
}: FreeTierCreditsSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [spendPools, setSpendPools] = useState<SpendPoolData[]>([]);
  const [poolData, setPoolData] = useState<PoolData>({
    totalBalance: 0,
  });

  const {
    mutate: createFreeTierPaymentLink,
    isPending: isCreatingFreeTierPaymentLink,
  } = api.apps.app.freeTier.payments.create.useMutation({
    onSuccess: async data => {
      window.open(data.paymentLink.url, '_blank');
      setDepositAmount('');
      setPoolName('');
      setDefaultSpendLimit('');

      // Refresh spend pools data
      await fetchSpendPools();
    },
  });

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');
  const [poolName, setPoolName] = useState('');
  const [defaultSpendLimit, setDefaultSpendLimit] = useState('');

  // Modal state
  const [editingPool, setEditingPool] = useState<SpendPoolData | null>(null);

  // Fetch spend pools data
  const fetchSpendPools = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/owner/apps/${appId}/free-tier-credits/spend-pools`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch spend pools');
      }

      const data = await response.json();
      setSpendPools(data.spendPools || []);

      // Calculate aggregate pool data
      const totalBalance = data.spendPools.reduce(
        (sum: number, pool: SpendPoolData) => sum + pool.remainingAmount,
        0
      );

      setPoolData({
        totalBalance,
      });
    } catch (error) {
      console.error('Error fetching spend pools:', error);
      // Set empty data on error
      setSpendPools([]);
      setPoolData({
        totalBalance: 0,
      });
    }
  }, [appId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSpendPools();
      setLoading(false);
    };

    loadData();
  }, [appId, fetchSpendPools]);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    createFreeTierPaymentLink({
      appId,
      amount: parseFloat(depositAmount),
      description: `Free Tier Credits${poolName ? ` - ${poolName}` : ''}`,
      poolName: poolName || undefined,
      defaultSpendLimit: defaultSpendLimit
        ? parseFloat(defaultSpendLimit)
        : undefined,
    });
  };

  const handleUpdateSpendLimit = async (poolId: string, newLimit: number) => {
    try {
      const response = await fetch(
        `/api/owner/apps/${appId}/free-tier-credits/spend-pools/${poolId}/limits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ defaultSpendLimit: newLimit }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update spend limit');
      }

      // Refresh spend pools data
      await fetchSpendPools();
    } catch (error) {
      console.error('Failed to update spend limit:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const formatDate = (dateInput: string | Date) => {
    const date =
      typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Credit Pool Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage your shared credit pool and monitor usage.
        </p>
      </div>

      {/* Pool Balance & Deposit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Pool Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 mb-4">
            {formatCurrency(poolData.totalBalance)}
          </div>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="deposit-amount"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Deposit Amount
              </label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount (e.g., 100.00)"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <Button
              onClick={handleDeposit}
              disabled={
                isCreatingFreeTierPaymentLink ||
                !depositAmount ||
                parseFloat(depositAmount) <= 0
              }
              className="w-full"
            >
              {isCreatingFreeTierPaymentLink ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Spend Pools */}
      {spendPools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Current Spend Pools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spendPools.map(pool => (
                <div
                  key={pool.id}
                  className="border rounded-lg p-4 bg-muted/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{pool.name}</h4>
                      {pool.description && (
                        <p className="text-sm text-muted-foreground">
                          {pool.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPool(pool)}
                        className="h-8!"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Limit
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Amount
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency(pool.totalPaid)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Spent</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {formatCurrency(pool.spentAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Remaining
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(pool.remainingAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Spend Limit per User
                      </div>
                      <div className="text-lg font-semibold text-purple-600">
                        {pool.defaultSpendLimit
                          ? formatCurrency(pool.defaultSpendLimit)
                          : 'No limit'}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>Created: {formatDate(pool.createdAt)}</div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Usage</span>
                      <span>
                        {((pool.spentAmount / pool.totalPaid) * 100).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((pool.spentAmount / pool.totalPaid) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spend Limit Modal */}
      {editingPool && (
        <SpendLimitModal
          pool={editingPool}
          onClose={() => setEditingPool(null)}
          onUpdate={handleUpdateSpendLimit}
        />
      )}
    </div>
  );
}
