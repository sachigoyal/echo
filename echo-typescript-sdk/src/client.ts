import axios, { AxiosInstance, AxiosError } from 'axios';
import { EchoConfig, getConfig } from './config';
import {
  Balance,
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  EchoApp,
  ListEchoAppsResponse,
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
   */
  async getPaymentUrl(amount: number, description?: string): Promise<string> {
    const response = await this.createPaymentLink({
      amount,
      description: description || 'Echo Credits',
    });
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
