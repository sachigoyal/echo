import {
  createEchoGoogle as createEchoGoogleBase,
  EchoConfig,
  EchoGoogleProvider,
  ROUTER_BASE_URL,
} from '@merit-systems/echo-typescript-sdk';
import { getEchoToken } from '../auth/token-manager';

export function createEchoGoogle({
  appId,
  baseRouterUrl = ROUTER_BASE_URL,
}: EchoConfig): EchoGoogleProvider {
  return createEchoGoogleBase({ appId, baseRouterUrl }, async () =>
    getEchoToken(appId)
  );
}
