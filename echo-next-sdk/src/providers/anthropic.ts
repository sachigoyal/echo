import { getEchoToken } from '../auth/token-manager';
import {
  createEchoAnthropic as createEchoAnthropicBase,
  EchoAnthropicProvider,
  EchoConfig,
} from '@merit-systems/echo-typescript-sdk';

export function createEchoAnthropic(config: EchoConfig): EchoAnthropicProvider {
  return createEchoAnthropicBase(config, async () => getEchoToken(config));
}
