'use client';

import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpendPoolData } from '@/lib/spend-pools';

interface SpendLimitModalProps {
  pool: SpendPoolData;
  onClose: () => void;
  onUpdate: (poolId: string, newLimit: number) => Promise<void>;
}

export default function SpendLimitModal({
  pool,
  onClose,
  onUpdate,
}: SpendLimitModalProps) {
  const [spendLimit, setSpendLimit] = useState(
    pool.defaultSpendLimit?.toString() || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const limitValue = parseFloat(spendLimit);

    if (isNaN(limitValue) || limitValue < 0.01) {
      setError('Spend limit must be at least $0.01');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onUpdate(pool.id, limitValue);
      onClose();
    } catch (err) {
      console.error('Failed to update spend limit:', err);
      setError('Failed to update spend limit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-background/75 backdrop-blur-sm overflow-y-auto h-full w-full z-50 fade-in">
      <div className="relative top-20 mx-auto p-5 border border-border w-full max-w-md shadow-lg rounded-md bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Edit Spend Limit
          </h3>
          <button onClick={onClose} className="!h-8 !w-8" disabled={loading}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Pool Info */}
          <div className="bg-muted/50 border border-border rounded-md p-3">
            <h4 className="font-medium text-card-foreground mb-2">
              {pool.name}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Total Pool</div>
                <div className="font-semibold text-blue-600">
                  {formatCurrency(pool.totalAmount)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Remaining</div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(pool.remainingAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Current Limit Display */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Current Default Spend Limit per User
            </label>
            <div className="px-3 py-2 border border-border bg-muted rounded-md text-card-foreground">
              {pool.defaultSpendLimit
                ? formatCurrency(pool.defaultSpendLimit)
                : 'No limit set'}
            </div>
          </div>

          {/* New Limit Input */}
          <div>
            <label
              htmlFor="spend-limit"
              className="block text-sm font-medium text-card-foreground mb-2"
            >
              New Default Spend Limit per User
            </label>
            <Input
              id="spend-limit"
              type="number"
              placeholder="Enter amount (e.g., 50.00)"
              value={spendLimit}
              onChange={e => {
                setSpendLimit(e.target.value);
                setError(''); // Clear error on input change
              }}
              min="0.01"
              step="0.01"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This limit applies to new users accessing this pool. Minimum limit
              is $0.01.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">How spend limits work:</p>
            <ul className="space-y-1 text-xs">
              <li>• Each user gets this amount to spend from this pool</li>
              <li>• Users with existing usage keep their current limits</li>
              <li>• Minimum spend limit is $0.01</li>
              <li>• Individual user limits can be set separately if needed</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !spendLimit}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
