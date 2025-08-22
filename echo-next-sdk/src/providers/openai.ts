import { getEchoToken } from '../auth/token-manager';
import {
  createEchoOpenAI as createEchoOpenAIBase,
  EchoConfig,
  EchoOpenAIProvider,
  ROUTER_BASE_URL,
} from '@merit-systems/echo-typescript-sdk';

export function createEchoOpenAI({
  appId,
  baseRouterUrl = ROUTER_BASE_URL,
}: EchoConfig): EchoOpenAIProvider {
  return createEchoOpenAIBase({ appId, baseRouterUrl }, async () =>
    getEchoToken(appId)
  );
}
