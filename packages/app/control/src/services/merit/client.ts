import { env } from '@/env';
import { MeritSDK } from '@merit-systems/sdk';

export const meritClient = new MeritSDK({
  apiKey: env.MERIT_API_KEY,
  baseURL: env.MERIT_BASE_URL,
  checkoutURL: env.MERIT_CHECKOUT_URL,
});
