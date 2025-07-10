'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/balance';

interface Balance {
  balance: string;
  totalPaid: string;
  totalSpent: string;
  currency: string;
}

interface Payment {
  id: string;
  stripePaymentId: string;
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

export default function CreditsPage() {
  const { user, isLoaded } = useUser();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaymentsPaginationInfo | null>(
    null
  );

  useEffect(() => {
    if (isLoaded && user) {
      fetchBalance();
      fetchPayments();
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

  const fetchPayments = async (page: number = 1) => {
    setPaymentsLoading(true);
    try {
      const response = await fetch(`/api/payments?page=${page}&limit=10`);
      if (response.ok) {
        const data: PaymentsResponse = await response.json();
        setPayments(data.payments);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching payments:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (
      !customAmount ||
      isNaN(Number(customAmount)) ||
      Number(customAmount) <= 0
    ) {
      return;
    }

    setPurchaseLoading(true);
    try {
      const amount = Number(customAmount);
      const response = await fetch('/api/stripe/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          description: `Echo Credits - $${amount}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        window.location.href = result.paymentLink.url;
      } else {
        console.error('Error creating payment link:', await response.text());
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="space-y-6">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="h-40 bg-muted rounded-lg"></div>
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Credits
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Row */}
          {/* Current Balance */}
          <Card className="h-80 flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Current Balance
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatCurrency(Number(balance?.balance) || 0)}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full opacity-50"></span>
                    <span>Help</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto Top-Up */}
          <Card className="h-80 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Auto Top-Up</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4">
                To activate auto-top-up, you&apos;ll need a payment method that
                supports offline charging.
              </p>
              <Button variant="outline" disabled>
                Add a Payment Method
              </Button>
            </CardContent>
          </Card>

          {/* Bottom Row */}
          {/* Buy Credits */}
          <Card className="h-80 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Buy Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Use crypto
                </span>
                <div className="w-10 h-6 bg-muted rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-background rounded-full transition-transform"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-3">
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount ($)"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddCredits}
                    disabled={
                      purchaseLoading ||
                      !customAmount ||
                      isNaN(Number(customAmount)) ||
                      Number(customAmount) <= 0
                    }
                    className="px-6 bg-primary hover:bg-primary/90"
                  >
                    {purchaseLoading ? 'Processing...' : 'Add Credits'}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                  >
                    View Usage →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="h-80 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {paymentsLoading ? (
                <div className="text-center py-8 flex items-center justify-center h-full">
                  <div>
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-muted-foreground mt-2">
                      Loading transactions...
                    </p>
                  </div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No credits purchased</p>
                </div>
              ) : (
                <div className="space-y-4 h-full overflow-y-auto">
                  {payments.map(payment => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {payment.description || 'Echo Credits Purchase'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                      <div className="text-right space-y-1 flex-shrink-0 ml-2">
                        <p className="font-semibold text-sm">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p
                          className={`text-xs capitalize ${getStatusColor(payment.status)}`}
                        >
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination.hasPreviousPage}
                      onClick={() => fetchPayments(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => fetchPayments(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
