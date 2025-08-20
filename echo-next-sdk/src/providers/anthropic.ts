import {
  anthropic,
  AnthropicProvider,
  createAnthropic as createAnthropicBase,
} from '@ai-sdk/anthropic';
import { ROUTER_BASE_URL } from 'config';
import { getEchoToken } from '../auth/token-manager';
import { AsyncProvider, EchoConfig } from '../types';

export type EchoAnthropicProvider = AsyncProvider<AnthropicProvider>;

export function createEchoAnthropic(config: EchoConfig): EchoAnthropicProvider {
  const getProvider = async () => {
    const token = await getEchoToken(config.appId);
    return createAnthropicBase({
      baseURL: ROUTER_BASE_URL,
      apiKey: token!,
    });
  };

  const anthropicFunction = async (modelId: string) => {
    const provider = await getProvider();
    return provider(modelId);
  };

  const implementation: EchoAnthropicProvider = Object.assign(
    anthropicFunction,
    {
      languageModel: async (modelId: string) => {
        const provider = await getProvider();
        return provider.languageModel(modelId);
      },
      chat: async (modelId: string) => {
        const provider = await getProvider();
        return provider.chat(modelId);
      },
      messages: async (modelId: string) => {
        const provider = await getProvider();
        return provider.messages(modelId);
      },
      // These are from the base provider, unclear if they actually work (this is just passing on vercel's incomplete types)
      textEmbeddingModel: async (modelId: string) => {
        const provider = await getProvider();
        return provider.textEmbeddingModel(modelId);
      },
      imageModel: async (modelId: string) => {
        const provider = await getProvider();
        return provider.imageModel(modelId);
      },
      tools: anthropic.tools, // Sync property
    }
  );

  return implementation;
}
