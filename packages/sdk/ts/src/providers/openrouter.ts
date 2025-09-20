import {
  createOpenRouter as createOpenRouterBase,
  OpenRouterProvider,
} from '@openrouter/ai-sdk-provider';
import { ROUTER_BASE_URL } from 'config';
import { EchoConfig } from '../types';
import { echoFetch } from './index';

function isEchoFetchInjected(provider: OpenRouterProvider): boolean {
  // Check if the provider's fetch function is wrapped by echoFetch
  // @ts-ignore - we need to access the internal fetch function
  const fetchFn = provider.client?.fetch || provider.fetch;
  return fetchFn?.name === 'echoFetchWrapper';
}

export function createEchoOpenRouter(
  { appId, baseRouterUrl = ROUTER_BASE_URL }: EchoConfig,
  getTokenFn: (appId: string) => Promise<string | null>,
  onInsufficientFunds?: () => void
): OpenRouterProvider {
  const provider = createOpenRouterBase({
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
      'Echo fetch injection failed. You may be using an incompatible version of @openrouter/ai-sdk-provider. ' +
        'Please ensure you have @openrouter/ai-sdk-provider ^1.2.0 installed.'
    );
  }

  return provider;
}
