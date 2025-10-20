import { ROUTER_BASE_URL } from 'config';
import { EchoConfig } from '../types';
import { validateAppId } from '../utils/validation';
import { echoFetch } from './index';

// xAI provider is OpenAI-compatible over our Echo router
export interface XAIProvider {
  /** Base URL for the Echo router */
  baseURL: string;
  /** Not used; replaced by echoFetch */
  apiKey: string;
  fetch: typeof fetch;
}

export function createEchoXAI(
  { appId, baseRouterUrl = ROUTER_BASE_URL }: EchoConfig,
  getTokenFn: (appId: string) => Promise<string | null>,
  onInsufficientFunds?: () => void
): XAIProvider {
  validateAppId(appId, 'createEchoXAI');

  return {
    baseURL: baseRouterUrl,
    apiKey: 'placeholder_replaced_by_echoFetch',
    fetch: echoFetch(
      fetch,
      async () => await getTokenFn(appId),
      onInsufficientFunds
    ),
  } as unknown as XAIProvider;
}
