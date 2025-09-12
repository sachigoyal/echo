import { env } from '@/env';
import { createHmac } from 'crypto';

/**
 * Hash an API key deterministically for O(1) database lookup
 * Uses HMAC-SHA256 for security while maintaining deterministic output
 * @param apiKey - The plaintext API key to hash
 * @returns string - The deterministic hash for database storage/lookup
 */
export function hashApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key must be a non-empty string');
  }

  // Use HMAC-SHA256 for secure, deterministic hashing
  return createHmac('sha256', env.API_KEY_HASH_SECRET)
    .update(apiKey)
    .digest('hex');
}
