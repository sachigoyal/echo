import axios, { AxiosInstance } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { ApiKeyTokenProvider, TokenProvider } from './auth/token-provider';
import { EchoConfig, getConfig } from './config';
import {
  AppsResource,
  BalanceResource,
  ModelsResource,
  PaymentsResource,
  UsersResource,
} from './resources';

export interface EchoClientOptions extends Partial<EchoConfig> {
  tokenProvider?: TokenProvider;
}

export class EchoClient {
  private http: AxiosInstance;
  private config: EchoConfig;
  private tokenProvider: TokenProvider;

  // Resource instances
  public readonly balance: BalanceResource;
  public readonly payments: PaymentsResource;
  public readonly apps: AppsResource;
  public readonly users: UsersResource;
  public readonly models: ModelsResource;

  constructor(options?: EchoClientOptions) {
    this.config = getConfig(options);

    // Set up token provider
    if (options?.tokenProvider) {
      this.tokenProvider = options.tokenProvider;
    } else {
      // Fallback to API key provider
      const apiKey = this.config.apiKey || process.env.ECHO_API_KEY;
      if (!apiKey) {
        throw new Error('No API key or token provider provided');
      }
      this.tokenProvider = new ApiKeyTokenProvider(apiKey);
    }

    // Create axios instance
    this.http = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30_000,
    });

    // Set up request interceptor to include token
    this.http.interceptors.request.use(async config => {
      const token = await this.tokenProvider.getAccessToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });

    const refreshAuthLogic = async (failedRequest: any) => {
      try {
        await this.tokenProvider.refreshToken();
        const newToken = await this.tokenProvider.getAccessToken();
        if (newToken) {
          failedRequest.response.config.headers['Authorization'] =
            `Bearer ${newToken}`;
        }
        return Promise.resolve();
      } catch (error) {
        if (this.tokenProvider.onRefreshError) {
          this.tokenProvider.onRefreshError(error as Error);
        }
        return Promise.reject(error);
      }
    };

    createAuthRefreshInterceptor(this.http, refreshAuthLogic, {
      statusCodes: [401],
      pauseInstanceWhileRefreshing: true,
    });

    // Initialize resource instances
    this.balance = new BalanceResource(this.http);
    this.payments = new PaymentsResource(this.http);
    this.apps = new AppsResource(this.http, this.config.baseUrl);
    this.users = new UsersResource(this.http);
    this.models = new ModelsResource(this.http);
  }
}
