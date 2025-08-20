import { ROUTER_BASE_URL } from 'config';
import { getEchoToken } from '../auth/token-manager';
import {
  createEchoAnthropic as createEchoAnthropicBase,
  EchoAnthropicProvider,
  EchoConfig,
} from '@merit-systems/echo-typescript-sdk';

export function createEchoAnthropic({
  appId,
  baseRouterUrl = ROUTER_BASE_URL,
}: EchoConfig): EchoAnthropicProvider {
  return createEchoAnthropicBase({ appId, baseRouterUrl }, async () =>
    getEchoToken(appId)
  );
}
