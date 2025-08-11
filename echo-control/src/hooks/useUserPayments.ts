'use client';

import { useState, useCallback } from 'react';

interface Payment {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentsPaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaymentsResponse {
  payments: Payment[];
  pagination: PaymentsPaginationInfo;
}

export function useUserPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaymentsPaginationInfo | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payments?page=${page}&limit=10`);
      if (response.ok) {
        const data: PaymentsResponse = await response.json();
        setPayments(data.payments);
        setPagination(data.pagination);
      } else {
        const errorText = await response.text();
        console.error('Error fetching payments:', errorText);
        setError('Failed to fetch payments');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    payments,
    loading,
    pagination,
    error,
    fetchPayments,
    refetch: fetchPayments,
  };
}
