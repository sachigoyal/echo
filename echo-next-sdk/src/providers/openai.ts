import {
  createOpenAI as createOpenAIBase,
  OpenAIProvider,
} from '@ai-sdk/openai';
import {
  EmbeddingModel,
  ImageModel,
  LanguageModel,
  SpeechModel,
  TranscriptionModel,
} from 'ai';
import { getEchoToken } from '../auth/token-manager';
import { EchoConfig } from '../types';

export interface EchoOpenAIProvider {
  (modelId: string): Promise<LanguageModel>;
  languageModel: (modelId: string) => Promise<LanguageModel>;
  chat: (modelId: string) => Promise<LanguageModel>;
  responses: (modelId: string) => Promise<LanguageModel>;
  completion: (modelId: string) => Promise<LanguageModel>;
  embedding: (modelId: string) => Promise<EmbeddingModel<string>>;
  textEmbedding: (modelId: string) => Promise<EmbeddingModel<string>>;
  textEmbeddingModel: (modelId: string) => Promise<EmbeddingModel<string>>;
  image: (modelId: string) => Promise<ImageModel>;
  imageModel: (modelId: string) => Promise<ImageModel>;
  transcription: (modelId: string) => Promise<TranscriptionModel>;
  speech: (modelId: string) => Promise<SpeechModel>;
}

/**
 * Creates an Echo-authenticated OpenAI provider that mirrors the exact interface
 */
export function createEchoOpenAI(config: EchoConfig): EchoOpenAIProvider {
  const getProvider = async (): Promise<OpenAIProvider> => {
    const token = await getEchoToken(config.appId);
    return createOpenAIBase({
      baseURL: 'https://echo.router.merit.systems',
      apiKey: token!,
    });
  };

  const openaiFunction = async (modelId: string) => {
    const provider = await getProvider();
    return provider(modelId);
  };

  return new Proxy(openaiFunction, {
    get(target, prop) {
      if (prop in target) return target[prop as keyof typeof target];

      return async (modelId: string) => {
        const provider = await getProvider();
        const method = provider[prop as keyof OpenAIProvider];

        if (typeof method === 'function') {
          return (method as Function)(modelId);
        }
        return method;
      };
    },
  }) as EchoOpenAIProvider;
}
