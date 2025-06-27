import axios, { AxiosInstance, AxiosError } from 'axios';
import { EchoConfig, getConfig } from './config.js';
import {
  Balance,
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  EchoApp,
  ListEchoAppsResponse,
  SupportedModel,
  SupportedModelsResponse,
  User,
} from './types';

export class EchoClient {
  private http: AxiosInstance;
  private config: EchoConfig;

  constructor(config?: Partial<EchoConfig>) {
    this.config = getConfig(config);
    this.http = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
    });

    // Add request interceptor to include API key
    this.http.interceptors.request.use(async config => {
      const apiKey = this.config.apiKey || process.env.ECHO_API_KEY;
      if (apiKey) {
        config.headers['Authorization'] = `Bearer ${apiKey}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.http.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          throw new Error(
            'Unauthorized. Invalid or expired API key. Please run "echo-cli login" to authenticate.'
          );
        }
        throw error;
      }
    );
  }

  /**
   * Get current balance for the authenticated user across all apps
   */
  async getBalance(): Promise<Balance> {
    try {
      const response = await this.http.get('/api/v1/balance');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch balance');
    }
  }

  /**
   * Create a payment link for purchasing credits
   * @param request Payment link details
   */
  async createPaymentLink(
    request: CreatePaymentLinkRequest
  ): Promise<CreatePaymentLinkResponse> {
    try {
      const response = await this.http.post(
        '/api/v1/stripe/payment-link',
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create payment link');
    }
  }

  /**
   * Get payment URL for purchasing credits
   * @param amount Amount to purchase in USD
   * @param description Optional description for the payment
   * @param successUrl Optional URL to redirect to after successful payment
   */
  async getPaymentUrl(
    amount: number,
    description?: string,
    successUrl?: string
  ): Promise<string> {
    const request: CreatePaymentLinkRequest = {
      amount,
      description: description || 'Echo Credits',
    };

    if (successUrl) {
      request.successUrl = successUrl;
    }

    const response = await this.createPaymentLink(request);
    return response.paymentLink.url;
  }

  /**
   * Get app URL for a specific Echo app
   * @param appId The Echo app ID
   */
  getAppUrl(appId: string): string {
    return `${this.config.baseUrl}/apps/${appId}`;
  }

  /**
   * List all Echo apps for the authenticated user
   */
  async listEchoApps(): Promise<EchoApp[]> {
    try {
      const response =
        await this.http.get<ListEchoAppsResponse>('/api/v1/apps');
      return response.data.apps;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch Echo apps');
    }
  }

  /**
   * Get a specific Echo app by ID
   * @param appId The Echo app ID
   */
  async getEchoApp(appId: string): Promise<EchoApp> {
    try {
      const response = await this.http.get(`/api/v1/apps/${appId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch Echo app');
    }
  }

  /**
   * Get current user information
   */
  async getUserInfo(): Promise<User> {
    try {
      const response = await this.http.get('/api/v1/user');
      return response.data as User;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch user info');
    }
  }

  /**
   * Get supported models with pricing, limits, and capabilities
   */
  async getSupportedModels(): Promise<SupportedModelsResponse> {
    try {
      const response = await this.http.get<SupportedModelsResponse>(
        '/api/v1/supported-models'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch supported models');
    }
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

  private handleError(error: any, message: string): Error {
    if (error.response?.data?.error) {
      return new Error(`${message}: ${error.response.data.error}`);
    }
    if (error.message) {
      return new Error(`${message}: ${error.message}`);
    }
    return new Error(message);
  }
}
