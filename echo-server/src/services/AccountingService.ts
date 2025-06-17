const costMap = {
  'gpt-4o': 0.0015,
  'gpt-4o-mini': 0.0015,
  'gpt-4': 0.0015,
  'gpt-3.5-turbo': 0.0015,
  'gpt-3.5-turbo-1106': 0.0015,
  'claude-3-5-sonnet': 0.015,
  'claude-3-7-sonnet': 0.015,
  'claude-3-5-sonnet-20240620': 0.015,
};

export const isValidModel = (model: string) => {
  return model in costMap;
};

export const getCostPerToken = (model: string) => {
  if (!isValidModel(model)) {
    throw new Error(`Invalid model: ${model}`);
  }
  return costMap[model as keyof typeof costMap];
};
