import { createOpenAI as createOpenAIBase } from '@ai-sdk/openai'; // TODO: fix this
import { LanguageModel } from 'ai';
import { EchoConfig } from 'types';
import { getEchoToken } from '../auth/token-manager';

// Derived from ./model_prices.json
// TODO: this is wrong because we should actually break it out into image models etc too
export type EchoOpenAIModelId =
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-5-chat'
  | 'gpt-5-chat-latest'
  | 'gpt-4'
  | 'gpt-4.1'
  | 'gpt-4.1-2025-04-14'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-mini-2025-04-14'
  | 'gpt-4.1-nano'
  | 'gpt-4.1-nano-2025-04-14'
  | 'gpt-4o'
  | 'gpt-4o-search-preview-2025-03-11'
  | 'gpt-4o-search-preview'
  | 'gpt-4.5-preview'
  | 'gpt-4.5-preview-2025-02-27'
  | 'gpt-4o-audio-preview'
  | 'gpt-4o-audio-preview-2024-12-17'
  | 'gpt-4o-audio-preview-2024-10-01'
  | 'gpt-4o-audio-preview-2025-06-03'
  | 'gpt-4o-mini-audio-preview'
  | 'gpt-4o-mini-audio-preview-2024-12-17'
  | 'gpt-4o-mini'
  | 'gpt-4o-mini-search-preview-2025-03-11'
  | 'gpt-4o-mini-search-preview'
  | 'gpt-4o-mini-2024-07-18'
  | 'o1'
  | 'o1-mini'
  | 'o3'
  | 'o3-2025-04-16'
  | 'o3-mini'
  | 'o3-mini-2025-01-31'
  | 'o4-mini'
  | 'o4-mini-2025-04-16'
  | 'o1-mini-2024-09-12'
  | 'o1-preview'
  | 'o1-preview-2024-09-12'
  | 'o1-2024-12-17'
  | 'chatgpt-4o-latest'
  | 'gpt-4o-2024-05-13'
  | 'gpt-4o-2024-08-06'
  | 'gpt-4o-2024-11-20'
  | 'gpt-4o-realtime-preview-2024-10-01'
  | 'gpt-4o-realtime-preview'
  | 'gpt-4o-realtime-preview-2024-12-17'
  | 'gpt-4o-mini-realtime-preview'
  | 'gpt-4o-mini-realtime-preview-2024-12-17'
  | 'gpt-4-turbo-preview'
  | 'gpt-4-0314'
  | 'gpt-4-0613'
  | 'gpt-4-32k'
  | 'gpt-4-32k-0314'
  | 'gpt-4-32k-0613'
  | 'gpt-4-turbo'
  | 'gpt-4-turbo-2024-04-09'
  | 'gpt-4-1106-preview'
  | 'gpt-4-0125-preview'
  | 'gpt-4-vision-preview'
  | 'gpt-4-1106-vision-preview'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-image-1';

// this feels like it is missing something, like why do we not defing the allowed models here
export const openai = async (
  config: EchoConfig,
  model: EchoOpenAIModelId
): Promise<LanguageModel> => {
  const token = await getEchoToken(config.appId);
  const openAiProvider = createOpenAIBase({
    baseURL: 'https://echo.router.merit.systems',
    apiKey: token!,
  });
  return openAiProvider(model);
};
