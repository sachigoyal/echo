import { useChat } from '@ai-sdk/react';
import { useWalletClient } from 'wagmi';
import { switchChain } from 'wagmi/actions';
import { useEffect, useRef, useState } from 'react';
import { createPaymentHeader } from './payment-header';
import type { Signer } from 'x402/types';
import { wagmiConfig } from '../wagmi-config';

// from wagmi config
const SUPPORTED_CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BASE: 8453,
  POLYGON: 137,
  ARBITRUM: 42161,
} as const;

const CHAIN_NAMES: Record<SupportedChainId, string> = {
  [SUPPORTED_CHAIN_IDS.ETHEREUM]: 'Ethereum',
  [SUPPORTED_CHAIN_IDS.OPTIMISM]: 'Optimism',
  [SUPPORTED_CHAIN_IDS.BASE]: 'Base',
  [SUPPORTED_CHAIN_IDS.POLYGON]: 'Polygon',
  [SUPPORTED_CHAIN_IDS.ARBITRUM]: 'Arbitrum',
};

const USDC_BASE_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

const USDC_DECIMALS = 6;

const PAYMENT_ERRORS = {
  NETWORK_SWITCH_FAILED: 'Please switch your wallet to the required network and try again.',
  PAYMENT_CREATION_FAILED: 'Failed to create payment. Please try again.',
  INSUFFICIENT_BALANCE: 'Payment failed. Please ensure sufficient balance on the required network and try again.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue using this service.',
};

const HTTP_STATUS = {
  PAYMENT_REQUIRED: 402,
} as const;

const HEADERS = {
  USE_X402: 'use-x402',
  X_PAYMENT: 'x-payment',
} as const;

type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[keyof typeof SUPPORTED_CHAIN_IDS];

interface PaymentAcceptSpec {
  network?: unknown;
  currency?: string;
  asset?: string;
  maxAmountRequired?: string;
  extra?: {
    name?: string;
  };
}

export function useChatWithPayment() {
  const { data: walletClient } = useWalletClient();
  const nativeFetch = useRef<typeof fetch>(fetch);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const originalFetch = nativeFetch.current;

    const wrappedFetch: typeof fetch = async (input, init?) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (!url.includes('/api/chat')) {
        return originalFetch(input, init);
      }

      // Clear previous payment errors when making a new request
      setPaymentError(null);

      const shouldUseX402Payment = !!walletClient;
      const headers = new Headers(init?.headers);
      headers.set(HEADERS.USE_X402, String(shouldUseX402Payment));
      
      // Only set x-payment header if we have a wallet
      if (shouldUseX402Payment) {
        headers.set(HEADERS.X_PAYMENT, '');
      }

      let response = await originalFetch(input, {
        ...init,
        headers,
      });

      if (response.status === HTTP_STATUS.PAYMENT_REQUIRED) {
        if (walletClient) {
          const paymentResponseBody = await response.clone().json();
          
          try {
            const paymentSpec: PaymentAcceptSpec = paymentResponseBody?.accepts?.[0];
            const requiredChainId = parseChainIdFromNetwork(paymentSpec?.network);
            const currentChainId = walletClient?.chain?.id;
            
            if (requiredChainId && currentChainId !== requiredChainId) {
              await switchChain(wagmiConfig, { chainId: requiredChainId });
            }
          } catch (networkSwitchError) {
            console.error('Network switch failed:', networkSwitchError);
            setPaymentError(PAYMENT_ERRORS.NETWORK_SWITCH_FAILED);
            return response;
          }

          try {
            const paymentHeader = await createPaymentHeader(
              walletClient as Signer,
              JSON.stringify(paymentResponseBody),
            );

            const retryHeaders = new Headers(init?.headers);
            retryHeaders.set(HEADERS.USE_X402, 'true');
            retryHeaders.set(HEADERS.X_PAYMENT, paymentHeader);

            response = await originalFetch(input, {
              ...init,
              headers: retryHeaders,
            });

            if (response.status === HTTP_STATUS.PAYMENT_REQUIRED) {
              try {
                const retryResponseBody = await response.clone().json();
                const retryPaymentSpec: PaymentAcceptSpec = retryResponseBody?.accepts?.[0];
                const friendlyErrorMessage = buildFriendlyPaymentMessage(retryPaymentSpec);
                setPaymentError(friendlyErrorMessage);
              } catch {
                setPaymentError(PAYMENT_ERRORS.INSUFFICIENT_BALANCE);
              }
            }
          } catch {
            setPaymentError(PAYMENT_ERRORS.PAYMENT_CREATION_FAILED);
          }
        } else {
          setPaymentError(PAYMENT_ERRORS.WALLET_NOT_CONNECTED);
        }
      }

      return response;
    };

    window.fetch = wrappedFetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [walletClient]);

  const chatResult = useChat();

  return {
    ...chatResult,
    paymentError,
    clearPaymentError: () => setPaymentError(null),
  };
}

function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return Object.values(SUPPORTED_CHAIN_IDS).includes(chainId as SupportedChainId);
}

function parseChainIdFromNetwork(network: unknown): SupportedChainId | null {
  if (typeof network === 'number') {
    return isSupportedChainId(network) ? network : null;
  }
  
  if (typeof network === 'string') {
    const normalizedNetwork = network.trim().toLowerCase();
    
    // Try to match EIP-155 format (e.g., "eip155:1")
    const eip155Pattern = /eip155:(\d+)/;
    const eip155Match = normalizedNetwork.match(eip155Pattern);
    if (eip155Match) {
      const chainId = Number(eip155Match[1]);
      return isSupportedChainId(chainId) ? chainId : null;
    }
    
    // Try to parse as plain number string
    const isNumericString = /^\d+$/.test(normalizedNetwork);
    if (isNumericString) {
      const chainId = Number(normalizedNetwork);
      return isSupportedChainId(chainId) ? chainId : null;
    }
    
    // Try to match by network name
    if (normalizedNetwork.includes('base')) {
      return SUPPORTED_CHAIN_IDS.BASE;
    }
    if (normalizedNetwork.includes('mainnet') || normalizedNetwork.includes('ethereum')) {
      return SUPPORTED_CHAIN_IDS.ETHEREUM;
    }
    if (normalizedNetwork.includes('polygon') || normalizedNetwork.includes('matic')) {
      return SUPPORTED_CHAIN_IDS.POLYGON;
    }
    if (normalizedNetwork.includes('arbitrum')) {
      return SUPPORTED_CHAIN_IDS.ARBITRUM;
    }
    if (normalizedNetwork.includes('optimism')) {
      return SUPPORTED_CHAIN_IDS.OPTIMISM;
    }
  }
  
  return null;
}

function formatTokenAmount(rawAmount: string, decimals: number): string {
  const isValidNumber = /^[0-9]+$/.test(rawAmount);
  if (!isValidNumber) {
    return rawAmount;
  }
  
  if (decimals === 0) {
    return rawAmount;
  }
  
  const rawLength = rawAmount.length;
  const paddingNeeded = Math.max(decimals - rawLength, 0);
  const paddedAmount = paddingNeeded > 0 ? '0'.repeat(paddingNeeded) + rawAmount : rawAmount;
  
  const decimalPosition = paddedAmount.length - decimals;
  const wholePart = decimalPosition > 0 ? paddedAmount.slice(0, decimalPosition) : '0';
  const fractionalPart = paddedAmount.slice(Math.max(decimalPosition, 0)).replace(/0+$/, '');
  
  return fractionalPart ? `${wholePart}.${fractionalPart}` : wholePart;
}

function getChainName(chainId: SupportedChainId): string {
  return CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
}

function isLikelyUsdcToken(tokenName: string, currencyAddress: string): boolean {
  const hasUsdInName = tokenName.toLowerCase().includes('usd');
  const isBaseUsdcAddress = currencyAddress === USDC_BASE_ADDRESS;
  
  return hasUsdInName || isBaseUsdcAddress;
}

function buildFriendlyPaymentMessage(paymentSpec: PaymentAcceptSpec): string {
  const network = paymentSpec?.network;
  const targetChainId = parseChainIdFromNetwork(network);
  const chainName = targetChainId 
    ? getChainName(targetChainId) 
    : String(network ?? 'the required network');
    
  const currencyAddress = (paymentSpec?.currency ?? paymentSpec?.asset)?.toLowerCase?.() || '';
  const tokenName = paymentSpec?.extra?.name || 'token';
  const maxAmountRequired = paymentSpec?.maxAmountRequired ?? '';

  const isUsdc = isLikelyUsdcToken(tokenName, currencyAddress);
  const amountDisplay = isUsdc 
    ? `${formatTokenAmount(String(maxAmountRequired), USDC_DECIMALS)} ${tokenName}` 
    : `${String(maxAmountRequired)} units`;

  return `Payment required: up to ${amountDisplay} on ${chainName}. Please top up and retry.`;
}
