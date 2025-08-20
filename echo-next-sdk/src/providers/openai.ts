import {
  createOpenAI as createOpenAIBase,
  openai,
  OpenAIProvider,
} from '@ai-sdk/openai';
import { ROUTER_BASE_URL } from 'config';
import { getEchoToken } from '../auth/token-manager';
import { AsyncProvider, EchoConfig } from '../types';

export type EchoOpenAIProvider = AsyncProvider<OpenAIProvider>;

export function createEchoOpenAI(config: EchoConfig): EchoOpenAIProvider {
  const getProvider = async () => {
    const token = await getEchoToken(config.appId);
    return createOpenAIBase({
      baseURL: ROUTER_BASE_URL,
      apiKey: token!,
    });
  };

  const openaiFunction = async (modelId: string) => {
    const provider = await getProvider();
    return provider(modelId);
  };

  const implementation: EchoOpenAIProvider = Object.assign(openaiFunction, {
    languageModel: async (modelId: string) => {
      const provider = await getProvider();
      return provider.languageModel(modelId);
    },
    chat: async (modelId: string) => {
      const provider = await getProvider();
      return provider.chat(modelId);
    },
    responses: async (modelId: string) => {
      const provider = await getProvider();
      return provider.responses(modelId);
    },
    completion: async (modelId: string) => {
      const provider = await getProvider();
      return provider.completion(modelId);
    },
    embedding: async (modelId: string) => {
      const provider = await getProvider();
      return provider.embedding(modelId);
    },
    textEmbedding: async (modelId: string) => {
      const provider = await getProvider();
      return provider.textEmbedding(modelId);
    },
    textEmbeddingModel: async (modelId: string) => {
      const provider = await getProvider();
      return provider.textEmbeddingModel(modelId);
    },
    image: async (modelId: string) => {
      const provider = await getProvider();
      return provider.image(modelId);
    },
    imageModel: async (modelId: string) => {
      const provider = await getProvider();
      return provider.imageModel(modelId);
    },
    transcription: async (modelId: string) => {
      const provider = await getProvider();
      return provider.transcription(modelId);
    },
    speech: async (modelId: string) => {
      const provider = await getProvider();
      return provider.speech(modelId);
    },
    tools: openai.tools, // Sync property
  });

  return implementation;
}
