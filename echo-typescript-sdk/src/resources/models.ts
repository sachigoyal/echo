import { HttpClient } from '../http-client';
import { BaseResource } from '../utils/error-handling';
import {
  OpenAIModels,
  AnthropicModels,
  GeminiModels,
  OpenRouterModels,
  OpenAIImageModels,
} from '../supported-models';

export class ModelsResource extends BaseResource {
  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * Get supported models as a list of model names
   */
  async getSupportedModels(): Promise<string[]> {
    const allModels = [
      ...OpenAIModels,
      ...AnthropicModels,
      ...GeminiModels,
      ...OpenRouterModels,
      ...OpenAIImageModels,
    ];

    return allModels.map(model => model.model_id);
  }

  /**
   * Get supported models as a flat array of model names
   */
  async listSupportedModels(): Promise<string[]> {
    return this.getSupportedModels();
  }

  /**
   * Get supported models grouped by provider (model names only)
   */
  async getSupportedModelsByProvider(): Promise<Record<string, string[]>> {
    const allModels = [
      ...OpenAIModels,
      ...AnthropicModels,
      ...GeminiModels,
      ...OpenRouterModels,
      ...OpenAIImageModels,
    ];

    const modelsByProvider: Record<string, string[]> = {};

    for (const model of allModels) {
      if (!modelsByProvider[model.provider]) {
        modelsByProvider[model.provider] = [];
      }
      modelsByProvider[model.provider]!.push(model.model_id);
    }

    return modelsByProvider;
  }
}
