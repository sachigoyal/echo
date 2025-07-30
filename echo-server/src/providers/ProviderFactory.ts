import { UnknownModelError } from '../errors/http';
import type { EchoControlService } from '../services/EchoControlService';
import modelPricesData from '../../model_prices.json';
import openRouterModelPrices from '../../open_router_model_prices.json';

import { AnthropicGPTProvider } from './AnthropicGPTProvider';
import { AnthropicNativeProvider } from './AnthropicNativeProvider';
import type { BaseProvider } from './BaseProvider';
import { GeminiProvider } from './GeminiProvider';
import { GPTProvider } from './GPTProvider';
import { ProviderType } from './ProviderType';
import { GeminiGPTProvider } from './GeminiGPTProvider';
import { OpenAIResponsesProvider } from './OpenAIResponsesProvider';
import { OpenRouterProvider } from './OpenRouterProvider';

/**
 * Creates model-to-provider mapping from the model_prices_and_context_window.json file.
 * This dynamically loads all supported models and maps them to their appropriate provider types
 * based on the litellm_provider field in the JSON configuration.
 */
const createModelToProviderMapping = (): Record<string, ProviderType> => {
  const mapping: Record<string, ProviderType> = {};

  for (const [modelName, modelConfig] of Object.entries(modelPricesData)) {
    // Skip the sample_spec entry
    if (modelName === 'sample_spec') continue;

    const config = modelConfig as any;
    if (config.litellm_provider) {
      switch (config.litellm_provider) {
        case 'openai':
          mapping[modelName] = ProviderType.GPT;
          break;
        case 'anthropic':
          mapping[modelName] = ProviderType.ANTHROPIC_GPT;
          break;
        case 'vertex_ai-language-models':
          mapping[modelName] = ProviderType.GEMINI;
          break;
        // Add other providers as needed
        default:
          // Skip models with unsupported providers
          break;
      }
    }
  }

  return mapping;
};

const createOpenRouterModelToProviderMapping = (): Record<
  string,
  ProviderType
> => {
  const mapping: Record<string, ProviderType> = {};

  for (const model of openRouterModelPrices['data']) {
    mapping[model.id] = ProviderType.OPENROUTER;
  }

  return mapping;
};
/**
 * Model-to-provider mapping loaded from model_prices_and_context_window.json
 * This replaces the previous hardcoded mapping and automatically includes all
 * supported models from the JSON configuration file.
 */
export const MODEL_TO_PROVIDER: Record<string, ProviderType> =
  createModelToProviderMapping();

export const OPEN_ROUTER_MODEL_TO_PROVIDER: Record<string, ProviderType> =
  createOpenRouterModelToProviderMapping();

export const getProvider = (
  model: string,
  echoControlService: EchoControlService,
  stream: boolean,
  completionPath: string
): BaseProvider => {
  // First check if the model is in the model to provider mapping
  let type = MODEL_TO_PROVIDER[model];
  // If the model is not in the model to provider mapping, check if it is in the OpenRouter model to provider mapping
  if (type === undefined) {
    type = OPEN_ROUTER_MODEL_TO_PROVIDER[model];
  }
  // If the model is not in either mapping, throw an error
  if (type === undefined) {
    throw new UnknownModelError(`Unknown model: ${model}`);
  }

  // Check if this is a Responses API endpoint
  if (completionPath.includes('responses')) {
    type = ProviderType.OPENAI_RESPONSES;
  }
  // We select for Anthropic Native if the completionPath includes "messages"
  // The OpenAI Format does not hit /v1/messages, it hits /v1/chat/completions
  // but the anthropic native format hits /v1/messages
  else if (
    type === ProviderType.ANTHROPIC_GPT &&
    completionPath.includes('messages')
  ) {
    type = ProviderType.ANTHROPIC_NATIVE;
  }

  if (type === ProviderType.GEMINI && completionPath.includes('completions')) {
    type = ProviderType.GEMINI_GPT;
  }

  switch (type) {
    case ProviderType.GPT:
      return new GPTProvider(echoControlService, stream, model);
    case ProviderType.ANTHROPIC_GPT:
      return new AnthropicGPTProvider(echoControlService, stream, model);
    case ProviderType.ANTHROPIC_NATIVE:
      return new AnthropicNativeProvider(echoControlService, stream, model);
    case ProviderType.GEMINI:
      return new GeminiProvider(echoControlService, stream, model);
    case ProviderType.GEMINI_GPT:
      return new GeminiGPTProvider(echoControlService, stream, model);
    case ProviderType.OPENAI_RESPONSES:
      return new OpenAIResponsesProvider(echoControlService, stream, model);
    case ProviderType.OPENROUTER:
      return new OpenRouterProvider(echoControlService, stream, model);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
};
