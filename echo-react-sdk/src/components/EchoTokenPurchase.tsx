import React, { useState } from 'react';
import { EchoTokenPurchaseProps } from '../types';
import { useEcho } from '../hooks/useEcho';
import { openPaymentFlow } from '../utils/security';

export function EchoTokenPurchase({
  amount = 100,
  onPurchaseComplete,
  onError,
  className = '',
  children,
}: EchoTokenPurchaseProps) {
  const { createPaymentLink, isAuthenticated, balance, refreshBalance } =
    useEcho();
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      const error = new Error('Please sign in to purchase tokens');
      setPurchaseError(error.message);
      if (onError) onError(error);
      return;
    }

    try {
      setIsProcessing(true);
      setPurchaseError(null);

      const paymentUrl = await createPaymentLink(amount);

      // Use CSP-compatible payment flow instead of direct window.open()
      await openPaymentFlow(paymentUrl, {
        onComplete: async () => {
          try {
            await refreshBalance();
            if (onPurchaseComplete && balance) {
              onPurchaseComplete(balance);
            }
          } catch (err) {
            const error =
              err instanceof Error
                ? err
                : new Error('Failed to refresh balance');
            setPurchaseError(error.message);
            if (onError) onError(error);
          } finally {
            setIsProcessing(false);
          }
        },
        onCancel: () => {
          setIsProcessing(false);
        },
        onError: err => {
          setPurchaseError(err.message);
          if (onError) onError(err);
          setIsProcessing(false);
        },
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to create payment link');
      setPurchaseError(error.message);
      if (onError) onError(error);
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`echo-token-purchase ${className}`}>
        <div
          className="echo-token-purchase-unauthorized"
          style={{
            padding: '12px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          Please sign in to purchase tokens
        </div>
      </div>
    );
  }

  return (
    <div className={`echo-token-purchase ${className}`}>
      <div
        className="echo-token-purchase-info"
        style={{ marginBottom: '16px' }}
      >
        {balance && (
          <div
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '8px',
            }}
          >
            Current balance: {balance.credits} {balance.currency}
          </div>
        )}

        <div
          style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#374151',
          }}
        >
          Purchase {amount} tokens
        </div>
      </div>

      {children ? (
        <div
          onClick={handlePurchase}
          style={{
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          {children}
        </div>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={isProcessing}
          className="echo-token-purchase-button"
          style={{
            padding: '12px 24px',
            backgroundColor: '#1f9ae0',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          {isProcessing ? 'Processing...' : `Purchase ${amount} Tokens`}
        </button>
      )}

      {purchaseError && (
        <div
          className="echo-token-purchase-error"
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {purchaseError}
        </div>
      )}
    </div>
  );
}
