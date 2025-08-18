import {
  EchoClient,
  getUserFriendlyMessage,
  parseEchoError,
} from '@merit-systems/echo-typescript-sdk';
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
        const response = await echoClient.payments.createPaymentLink({
          amount,
          description: description || 'Echo Credits',
          successUrl: successUrl || window.location.origin,
        });

        setError(null);
        return response.paymentLink.url;
      } catch (err) {
        const echoError = parseEchoError(err, 'creating payment link');
        const userFriendlyMessage = getUserFriendlyMessage(echoError);
        setError(userFriendlyMessage);
        throw echoError;
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
