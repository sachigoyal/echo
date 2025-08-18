import { AxiosInstance } from 'axios';
import { EchoApp, ListEchoAppsResponse } from '../types';

export class AppsResource {
  constructor(
    private http: AxiosInstance,
    private baseUrl: string
  ) {}

  /**
   * List all Echo apps for the authenticated user
   */
  async listEchoApps(): Promise<EchoApp[]> {
    const response = await this.http.get<ListEchoAppsResponse>('/api/v1/apps');
    return response.data.apps;
  }

  /**
   * Get a specific Echo app by ID
   * @param appId The Echo app ID
   */
  async getEchoApp(appId: string): Promise<EchoApp> {
    const response = await this.http.get<EchoApp>(`/api/v1/apps/${appId}`);
    return response.data;
  }

  /**
   * Get app URL for a specific Echo app
   * @param appId The Echo app ID
   */
  getAppUrl(appId: string): string {
    return `${this.baseUrl}/apps/${appId}`;
  }
}
