import { AxiosInstance } from 'axios';
import { CreatePaymentLinkRequest, CreatePaymentLinkResponse } from '../types';

export class PaymentsResource {
  constructor(private http: AxiosInstance) {}

  /**
   * Create a payment link for purchasing credits
   * @param request Payment link details
   */
  async createPaymentLink(
    request: CreatePaymentLinkRequest
  ): Promise<CreatePaymentLinkResponse> {
    const response = await this.http.post<CreatePaymentLinkResponse>(
      '/api/v1/stripe/payment-link',
      request
    );
    return response.data;
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
}
