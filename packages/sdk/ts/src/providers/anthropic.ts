import {
  AnthropicProvider,
  createAnthropic as createAnthropicBase,
} from '@ai-sdk/anthropic';
import { ROUTER_BASE_URL } from '../config';
import { EchoConfig } from '../types';
import { echoFetch } from './index';

function isEchoFetchInjected(provider: AnthropicProvider): boolean {
  // Check if the provider's fetch function is wrapped by echoFetch
  // @ts-ignore - we need to access the internal fetch function
  const fetchFn = provider.client?.fetch || provider.fetch;
  return fetchFn?.name === 'echoFetchWrapper';
}

export function createEchoAnthropic(
  { appId, baseRouterUrl = ROUTER_BASE_URL }: EchoConfig,
  getTokenFn: (appId: string) => Promise<string | null>,
  onInsufficientFunds?: () => void
): AnthropicProvider {
  const provider = createAnthropicBase({
    baseURL: baseRouterUrl,
    apiKey: 'placeholder_replaced_by_echoFetch',
    headers: {
      // this is safe in Echo because the token is an echo oauth jwt
      // not a long lived anthropic api key
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    fetch: echoFetch(
      fetch,
      async () => await getTokenFn(appId),
      onInsufficientFunds
    ),
  });

  // Verify the injection worked
  if (!isEchoFetchInjected(provider)) {
    throw new Error(
      'Echo fetch injection failed. You may be using an incompatible version of @ai-sdk/anthropic. ' +
        'Please ensure you have @ai-sdk/anthropic ^2.0.17 installed.'
    );
  }

  return provider;
}
