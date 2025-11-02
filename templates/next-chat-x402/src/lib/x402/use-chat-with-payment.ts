import { useChat } from '@ai-sdk/react';
import { useWalletClient } from 'wagmi';
import { useEffect, useRef } from 'react';
import { createPaymentHeader } from './payment-header';
import type { Signer } from 'x402/types';

export function useChatWithPayment() {
  const { data: walletClient } = useWalletClient();
  const nativeFetch = useRef<typeof fetch>(fetch);

  useEffect(() => {
    const originalFetch = nativeFetch.current;

    const wrappedFetch: typeof fetch = async (input, init?) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (!url.includes('/api/chat')) {
        return originalFetch(input, init);
      }

      const useX402 = !!walletClient;
      const headers = new Headers(init?.headers);
      headers.set('use-x402', String(useX402));
      headers.set('x-payment', '');

      let response = await originalFetch(input, {
        ...init,
        headers,
      });

      if (response.status === 402 && walletClient) {
        const errorBody = await response.json();
        const paymentHeader = await createPaymentHeader(
          walletClient as Signer,
          JSON.stringify(errorBody),
        );

        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set('use-x402', 'true');
        retryHeaders.set('x-payment', paymentHeader);

        response = await originalFetch(input, {
          ...init,
          headers: retryHeaders,
        });
      }

      return response;
    };

    window.fetch = wrappedFetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [walletClient]);

  return useChat();
}

