'use client';

import { useState, useCallback } from 'react';
import { Balance } from '@/lib/types/apps';

export function useUserBalance() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const data = await response.json();
      setBalance(data);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    balance,
    loading,
    error,
    fetchBalance,
    refetch: fetchBalance,
  };
}
