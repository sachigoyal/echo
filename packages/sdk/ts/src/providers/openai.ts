import {
  createOpenAI as createOpenAIBase,
  OpenAIProvider,
} from '@ai-sdk/openai';
import { ROUTER_BASE_URL } from 'config';
import { EchoConfig } from '../types';
import { echoFetch } from './index';

function isEchoFetchInjected(provider: OpenAIProvider): boolean {
  // Check if the provider's fetch function is wrapped by echoFetch
  // @ts-ignore - we need to access the internal fetch function
  const fetchFn = provider.client?.fetch || provider.fetch;
  return fetchFn?.name === 'echoFetchWrapper';
}

export function createEchoOpenAI(
  { appId, baseRouterUrl = ROUTER_BASE_URL }: EchoConfig,
  getTokenFn: (appId: string) => Promise<string | null>,
  onInsufficientFunds?: () => void
): OpenAIProvider {
  const provider = createOpenAIBase({
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
      'Echo fetch injection failed. You may be using an incompatible version of @ai-sdk/openai. ' +
        'Please ensure you have @ai-sdk/openai ^2.0.32 installed.'
    );
  }

  return provider;
}
