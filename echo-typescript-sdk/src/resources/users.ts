import { AxiosInstance } from 'axios';
import {
  RegisterReferralCodeRequest,
  RegisterReferralCodeResponse,
  User,
} from '../types';

export class UsersResource {
  constructor(private http: AxiosInstance) {}

  /**
   * Get current user information
   */
  async getUserInfo(): Promise<User> {
    const response = await this.http.get<User>('/api/v1/user');
    return response.data;
  }

  /**
   * Register a referral code for the authenticated user
   * @param echoAppId The Echo app ID to register the referral code for
   * @param code The referral code to register
   */
  async registerReferralCode(
    echoAppId: string,
    code: string
  ): Promise<RegisterReferralCodeResponse> {
    const request: RegisterReferralCodeRequest = { echoAppId, code };
    const response = await this.http.post<RegisterReferralCodeResponse>(
      '/api/v1/user/referral',
      request
    );
    return response.data;
  }
}
