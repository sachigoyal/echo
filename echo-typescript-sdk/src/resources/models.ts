import { AxiosInstance } from 'axios';
import { SupportedModel, SupportedModelsResponse } from '../types';

export class ModelsResource {
  constructor(private http: AxiosInstance) {}

  /**
   * Get supported models with pricing, limits, and capabilities
   */
  async getSupportedModels(): Promise<SupportedModelsResponse> {
    const response = await this.http.get<SupportedModelsResponse>(
      '/api/v1/supported-models'
    );
    return response.data;
  }

  /**
   * Get supported models as a flat array
   */
  async listSupportedModels(): Promise<SupportedModel[]> {
    const response = await this.getSupportedModels();
    return response.models;
  }

  /**
   * Get supported models grouped by provider
   */
  async getSupportedModelsByProvider(): Promise<
    Record<string, SupportedModel[]>
  > {
    const response = await this.getSupportedModels();
    return response.models_by_provider;
  }
}
