import {
  createEchoGoogle as createEchoGoogleBase,
  EchoConfig,
  EchoGoogleProvider,
} from '@merit-systems/echo-typescript-sdk';
import { getEchoToken } from '../auth/token-manager';

export function createEchoGoogle(config: EchoConfig): EchoGoogleProvider {
  return createEchoGoogleBase(config, async () => getEchoToken(config));
}
