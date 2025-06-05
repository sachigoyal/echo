'use client';

import { useState } from 'react';
import { CreditCard, DollarSign, Zap } from 'lucide-react';

interface AppPaymentCardProps {
  appId: string;
  appName: string;
  currentBalance: number;
}

const CREDIT_PACKAGES = [
  { amount: 10, price: 10, popular: false },
  { amount: 25, price: 25, popular: true },
  { amount: 50, price: 50, popular: false },
  { amount: 100, price: 100, popular: false },
];

export default function AppPaymentCard({
  appId,
  appName,
  currentBalance,
}: AppPaymentCardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]); // Default to popular option

  const handlePurchaseCredits = async (amount: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: `Echo Credits for ${appName}`,
          echoAppId: appId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      if (data.paymentLink?.url) {
        // Navigate to Stripe payment page instead of opening in popup
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

  return (
    <div className="bg-gradient-to-br from-card to-card/80 rounded-lg border border-border p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="md:w-1/3">
          <div className="flex items-center justify-between md:flex-col md:items-start">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Credits for {appName}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Current balance:{' '}
                <span className="font-medium text-primary">
                  ${currentBalance.toFixed(2)}
                </span>
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 md:mt-4 md:hidden lg:flex">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="md:w-2/3">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-card-foreground">
              Choose a credit package:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CREDIT_PACKAGES.map(pkg => (
                <button
                  key={pkg.amount}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedPackage.amount === pkg.amount
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-card-foreground">
                        ${pkg.amount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        credits
                      </div>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Pay ${pkg.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <button
            onClick={() => handlePurchaseCredits(selectedPackage.amount)}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 disabled:from-primary/50 disabled:to-primary/40 text-primary-foreground font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase ${selectedPackage.amount} Credits
              </>
            )}
          </button>

          <div className="mt-2 text-xs text-muted-foreground text-center">
            Credits will be added to your account for{' '}
            <span className="font-medium">{appName}</span> immediately after
            payment
          </div>
        </div>
      </div>
    </div>
  );
}
