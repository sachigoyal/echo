import {
  createEchoGoogle as createEchoGoogleBase,
  EchoConfig,
  EchoGoogleProvider,
} from '@merit-systems/echo-typescript-sdk';
import { ROUTER_BASE_URL } from 'config';
import { getEchoToken } from '../auth/token-manager';

export function createEchoGoogle({
  appId,
  baseRouterUrl = ROUTER_BASE_URL,
}: EchoConfig): EchoGoogleProvider {
  return createEchoGoogleBase({ appId, baseRouterUrl }, async () =>
    getEchoToken(appId)
  );
}
