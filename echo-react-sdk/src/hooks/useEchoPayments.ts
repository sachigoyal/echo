import { EchoClient } from '@merit-systems/echo-typescript-sdk';
import { useCallback, useState } from 'react';

export function useEchoPayments(echoClient: EchoClient | null) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createPaymentLink = useCallback(
    async (
      amount: number,
      description?: string,
      successUrl?: string
    ): Promise<string> => {
      if (!echoClient) {
        throw new Error('Not authenticated');
      }

      setIsLoading(true);
      try {
        const response = await echoClient.createPaymentLink({
          amount,
          description: description || 'Echo Credits',
          successUrl: successUrl || window.location.origin,
        });

        setError(null);
        return response.paymentLink.url;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create payment link';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [echoClient]
  );

  return {
    createPaymentLink,
    error,
    isLoading,
  };
}
