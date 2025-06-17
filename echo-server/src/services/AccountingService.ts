import modelPrices from '../../model_prices.json';

export const isValidModel = (model: string) => {
  return model in modelPrices;
};

export const getCostPerToken = (
  model: string,
  inputTokens: number,
  outputTokens: number
) => {
  if (!isValidModel(model)) {
    throw new Error(`Invalid model: ${model}`);
  }

  const modelPrice = modelPrices[model as keyof typeof modelPrices];
  return (
    modelPrice.input_cost_per_token * inputTokens +
    modelPrice.output_cost_per_token * outputTokens
  );
};
