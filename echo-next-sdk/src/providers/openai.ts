import { getEchoToken } from '../auth/token-manager';
import {
  createEchoOpenAI as createEchoOpenAIBase,
  EchoConfig,
  EchoOpenAIProvider,
} from '@merit-systems/echo-typescript-sdk';

export function createEchoOpenAI(config: EchoConfig): EchoOpenAIProvider {
  return createEchoOpenAIBase(config, async () => getEchoToken(config));
}
