import { AxiosInstance } from 'axios';
import { Balance, FreeBalance, GetFreeBalanceRequest } from '../types';

export class BalanceResource {
  constructor(private http: AxiosInstance) {}

  /**
   * Get current balance for the authenticated user across all apps
   */
  async getBalance(): Promise<Balance> {
    const response = await this.http.get<Balance>('/api/v1/balance');
    return response.data;
  }

  /**
   * Get free tier balance for a specific app
   * @param echoAppId The Echo app ID to get free tier balance for
   */
  async getFreeBalance(echoAppId: string): Promise<FreeBalance> {
    const request: GetFreeBalanceRequest = { echoAppId };
    const response = await this.http.post<FreeBalance>(
      '/api/v1/balance/free',
      request
    );
    return response.data;
  }
}
