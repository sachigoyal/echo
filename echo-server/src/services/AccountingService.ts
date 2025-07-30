import {
  MODEL_TO_PROVIDER,
  OPEN_ROUTER_MODEL_TO_PROVIDER,
} from '../providers/ProviderFactory';
import modelPrices from '../../model_prices.json';
import openRouterModelPrices from '../../open_router_model_prices.json';

const getModelPrice = (model: string) => {
  // First check if the model is in the main model_prices.json
  if (model in modelPrices) {
    return modelPrices[model as keyof typeof modelPrices];
  }

  // If not found, check in open_router_model_prices.json
  const openRouterModel = openRouterModelPrices.data.find(
    (modelData: any) => modelData.id === model
  );

  if (openRouterModel) {
    // Convert OpenRouter pricing format to our internal format
    return {
      input_cost_per_token: parseFloat(openRouterModel.pricing.prompt),
      output_cost_per_token: parseFloat(openRouterModel.pricing.completion),
      max_tokens: openRouterModel.context_length,
      max_input_tokens: openRouterModel.context_length,
      max_output_tokens:
        openRouterModel.top_provider?.max_completion_tokens ||
        openRouterModel.context_length,
      litellm_provider: 'openrouter',
      mode: 'chat',
    };
  }

  return null;
};

export { getModelPrice };

export const isValidModel = (model: string) => {
  return (
    model in MODEL_TO_PROVIDER ||
    model in OPEN_ROUTER_MODEL_TO_PROVIDER ||
    getModelPrice(model) !== null
  );
};

export const getCostPerToken = (
  model: string,
  inputTokens: number,
  outputTokens: number
) => {
  if (!isValidModel(model)) {
    throw new Error(`Invalid model: ${model}`);
  }

  const modelPrice = getModelPrice(model);
  if (!modelPrice) {
    throw new Error(`Pricing information not found for model: ${model}`);
  }

  return (
    modelPrice.input_cost_per_token * inputTokens +
    modelPrice.output_cost_per_token * outputTokens
  );
};
