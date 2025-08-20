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
import { ROUTER_BASE_URL } from 'config';
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
      baseURL: ROUTER_BASE_URL,
      apiKey: token!,
    });
  };

  const openaiFunction = async (modelId: string) => {
    const provider = await getProvider();
    return provider(modelId);
  };

  // Add methods to the function object
  openaiFunction.languageModel = async (modelId: string) => {
    const provider = await getProvider();
    return provider.languageModel(modelId);
  };

  openaiFunction.chat = async (modelId: string) => {
    const provider = await getProvider();
    return provider.chat(modelId);
  };

  openaiFunction.responses = async (modelId: string) => {
    const provider = await getProvider();
    return provider.responses(modelId);
  };

  openaiFunction.completion = async (modelId: string) => {
    const provider = await getProvider();
    return provider.completion(modelId);
  };

  openaiFunction.embedding = async (modelId: string) => {
    const provider = await getProvider();
    return provider.embedding(modelId);
  };

  openaiFunction.textEmbedding = async (modelId: string) => {
    const provider = await getProvider();
    return provider.textEmbedding(modelId);
  };

  openaiFunction.textEmbeddingModel = async (modelId: string) => {
    const provider = await getProvider();
    return provider.textEmbeddingModel(modelId);
  };

  openaiFunction.image = async (modelId: string) => {
    const provider = await getProvider();
    return provider.image(modelId);
  };

  openaiFunction.imageModel = async (modelId: string) => {
    const provider = await getProvider();
    return provider.imageModel(modelId);
  };

  openaiFunction.transcription = async (modelId: string) => {
    const provider = await getProvider();
    return provider.transcription(modelId);
  };

  openaiFunction.speech = async (modelId: string) => {
    const provider = await getProvider();
    return provider.speech(modelId);
  };

  return openaiFunction as EchoOpenAIProvider;
}
