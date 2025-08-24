import {
  createEchoAnthropic,
  createEchoGoogle,
  createEchoOpenAI,
} from '@merit-systems/echo-typescript-sdk';
import { useMemo } from 'react';
import { useEcho } from './useEcho';

export const useEchoModelProviders = () => {
  const { token, config } = useEcho();

  return useMemo(() => {
    const baseConfig = {
      appId: config.appId!,
      baseRouterUrl: config.baseRouterUrl!,
    };
    const getToken = async () => token;

    return {
      openai: createEchoOpenAI(baseConfig, getToken),
      anthropic: createEchoAnthropic(baseConfig, getToken),
      google: createEchoGoogle(baseConfig, getToken),
    };
  }, [token, config.appId, config.baseRouterUrl]);
};
