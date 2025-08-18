import { AxiosInstance } from 'axios';
import { SupportedModel, SupportedModelsResponse } from '../types';
import { BaseResource } from '../utils/error-handling';

export class ModelsResource extends BaseResource {
  constructor(http: AxiosInstance) {
    super(http);
  }

  /**
   * Get supported models with pricing, limits, and capabilities
   */
  async getSupportedModels(): Promise<SupportedModelsResponse> {
    return this.handleRequest(
      () => this.http.get<SupportedModelsResponse>('/api/v1/supported-models'),
      'fetching supported models',
      '/api/v1/supported-models'
    );
  }

  /**
   * Get supported models as a flat array
   */
  async listSupportedModels(): Promise<SupportedModel[]> {
    try {
      const response = await this.getSupportedModels();
      return response.models;
    } catch (error) {
      throw this.handleError(error, 'listing supported models');
    }
  }

  /**
   * Get supported models grouped by provider
   */
  async getSupportedModelsByProvider(): Promise<
    Record<string, SupportedModel[]>
  > {
    try {
      const response = await this.getSupportedModels();
      return response.models_by_provider;
    } catch (error) {
      throw this.handleError(error, 'getting models by provider');
    }
  }
}
