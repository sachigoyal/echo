import {
  createGoogleGenerativeAI as createGoogleBase,
  GoogleGenerativeAIProvider,
} from '@ai-sdk/google';
import { ROUTER_BASE_URL } from 'config';
import { EchoConfig } from '../types';
import { echoFetch } from './index';

function isEchoFetchInjected(provider: GoogleGenerativeAIProvider): boolean {
  // Check if the provider's fetch function is wrapped by echoFetch
  // @ts-ignore - we need to access the internal fetch function
  const fetchFn = provider.client?.fetch || provider.fetch;
  return fetchFn?.name === 'echoFetchWrapper';
}

export function createEchoGoogle(
  { appId, baseRouterUrl = ROUTER_BASE_URL }: EchoConfig,
  getTokenFn: (appId: string) => Promise<string | null>,
  onInsufficientFunds?: () => void
): GoogleGenerativeAIProvider {
  const provider = createGoogleBase({
    baseURL: baseRouterUrl,
    apiKey: 'placeholder_replaced_by_echoFetch',
    fetch: echoFetch(
      fetch,
      async () => await getTokenFn(appId),
      onInsufficientFunds
    ),
  });

  // Verify the injection worked
  if (!isEchoFetchInjected(provider)) {
    throw new Error(
      'Echo fetch injection failed. You may be using an incompatible version of @ai-sdk/google. ' +
        'Please ensure you have @ai-sdk/google ^2.0.14 installed.'
    );
  }

  return provider;
}
