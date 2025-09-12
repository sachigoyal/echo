import { env } from '@/env';
import { createHmac } from 'crypto';

export function hashApiKey(apiKey: string): string {
  if (apiKey.length === 0) {
    throw new Error('API key must be a non-empty string');
  }

  return createHmac('sha256', env.API_KEY_HASH_SECRET)
    .update(apiKey)
    .digest('hex');
}
