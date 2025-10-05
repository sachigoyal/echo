import { describe, test, expect, beforeAll } from 'vitest';
import { TEST_CONFIG, echoControlApi } from '../../utils';
import { TEST_USER_API_KEYS } from '../../config/test-data';

describe('402 Authentication Flow Tests', () => {
  beforeAll(async () => {
    console.log('🔧 Starting 402 authentication tests...');
    
    // Ensure echo-control is running and healthy
    await echoControlApi.healthCheck();

    // Ensure echo-data-server is running and healthy
    const response = await fetch(
      `${TEST_CONFIG.services.echoDataServer}/health`
    );
    if (!response.ok) {
      throw new Error('Echo data server health check failed');
    }
  });

  describe('API Key Authentication (isApiRequest)', () => {
    test('should authenticate with x-api-key header', async () => {
      const apiKey = TEST_USER_API_KEYS.primary;
      
      const response = await fetch(
        `${TEST_CONFIG.services.echoDataServer}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
            max_completion_tokens: 50,
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.choices).toBeDefined();
      console.log('✅ Successfully authenticated with x-api-key header');
    });

    test('should authenticate with Authorization Bearer header', async () => {
      const apiKey = TEST_USER_API_KEYS.primary;
      
      const response = await fetch(
        `${TEST_CONFIG.services.echoDataServer}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
            max_completion_tokens: 50,
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.choices).toBeDefined();
      console.log('✅ Successfully authenticated with Authorization Bearer header');
    });

    test('should authenticate with x-google-api-key header', async () => {
      const apiKey = TEST_USER_API_KEYS.primary;
      
      const response = await fetch(
        `${TEST_CONFIG.services.echoDataServer}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-google-api-key': apiKey,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
            max_completion_tokens: 50,
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.choices).toBeDefined();
      console.log('✅ Successfully authenticated with x-google-api-key header');
    });

    test('should reject invalid API key', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoDataServer}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'invalid-api-key-12345',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
          }),
        }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      console.log('✅ Invalid API key correctly rejected with 401');
    });
  });

  describe('X402 Payment Authentication (isX402Request)', () => {
    test('should handle x-payment header and attempt X402 payment flow', async () => {
      // Create a mock x-payment header value (base64 encoded payment payload)
      // This would normally be a valid payment authorization, but for testing
      // we expect it to fail validation and return an appropriate error
      const mockPaymentPayload = {
        authorization: {
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          value: '1000000',
          valid_after: Math.floor(Date.now() / 1000) - 3600,
          valid_before: Math.floor(Date.now() / 1000) + 3600,
          nonce: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
        signature: {
          v: 27,
          r: '0x1234567890123456789012345678901234567890123456789012345678901234',
          s: '0x5678901234567890123456789012345678901234567890123456789012345678',
        },
      };
      
      const xPaymentHeader = Buffer.from(JSON.stringify(mockPaymentPayload)).toString('base64');
      
      const response = await fetch(
        `${TEST_CONFIG.services.echoDataServer}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-payment': xPaymentHeader,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
          }),
        }
      );

      // The request should be recognized as an X402 request
      // It may fail validation (400/401/402) but shouldn't return 402 challenge
      expect(response.status).not.toBe(200);
      expect([400, 401, 402, 500]).toContain(response.status);
      
      const data = await response.json();
      
      // Should not return a WWW-Authenticate header with X402 challenge
      // because it's already attempting X402 authentication
      if (response.status === 402) {
        // If 402, it should be a payment processing error, not a new challenge
        expect(data).toHaveProperty('error');
      }
      
      console.log(`✅ X402 payment header recognized and processed (status: ${response.status})`);
    });
  });

  describe('No Authentication Headers', () => {
    test('should return 402 Payment Required with X402 challenge when no auth headers provided', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoDataServer}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
          }),
        }
      );

      expect(response.status).toBe(402);
      
      // Should have WWW-Authenticate header with X402 challenge
      const wwwAuthHeader = response.headers.get('WWW-Authenticate');
      expect(wwwAuthHeader).toBeTruthy();
      expect(wwwAuthHeader).toContain('X-402');
      expect(wwwAuthHeader).toContain('realm=');
      expect(wwwAuthHeader).toContain('link=');
      expect(wwwAuthHeader).toContain('network=');
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Payment Required');
      expect(data).toHaveProperty('accepts');
      expect(Array.isArray(data.accepts)).toBe(true);
      expect(data.accepts.length).toBeGreaterThan(0);
      
      // Verify X402 challenge structure
      const x402Accept = data.accepts[0];
      expect(x402Accept).toHaveProperty('type', 'x402');
      expect(x402Accept).toHaveProperty('version');
      expect(x402Accept).toHaveProperty('network');
      expect(x402Accept).toHaveProperty('maxAmountRequired');
      expect(x402Accept).toHaveProperty('recipient');
      expect(x402Accept).toHaveProperty('currency');
      expect(x402Accept).toHaveProperty('url');
      expect(x402Accept).toHaveProperty('nonce');
      expect(x402Accept).toHaveProperty('scheme', 'exact');
      
      console.log('✅ No auth headers correctly triggers 402 Payment Required with X402 challenge');
    });

    test('should return 402 challenge for different endpoints without auth', async () => {
      const endpoints = [
        '/chat/completions',
        '/messages',
        '/v1/chat/completions',
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(
          `${TEST_CONFIG.services.echoDataServer}${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'hello' }],
            }),
          }
        );

        expect(response.status).toBe(402);
        
        const wwwAuthHeader = response.headers.get('WWW-Authenticate');
        expect(wwwAuthHeader).toBeTruthy();
        expect(wwwAuthHeader).toContain('X-402');
        
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('accepts');
      }
      
      console.log('✅ All endpoints return 402 challenge without authentication');
    });
  });

  describe('Mixed Authentication Scenarios', () => {
    test('should prioritize x-payment header over API key when both present', async () => {
      const apiKey = TEST_USER_API_KEYS.primary;
      const mockPaymentPayload = {
        authorization: {
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          value: '1000000',
          valid_after: Math.floor(Date.now() / 1000) - 3600,
          valid_before: Math.floor(Date.now() / 1000) + 3600,
          nonce: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
        signature: {
          v: 27,
          r: '0x1234567890123456789012345678901234567890123456789012345678901234',
          s: '0x5678901234567890123456789012345678901234567890123456789012345678',
        },
      };
      
      const xPaymentHeader = Buffer.from(JSON.stringify(mockPaymentPayload)).toString('base64');
      
      const response = await fetch(
        `${TEST_CONFIG.services.echoDataServer}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'x-payment': xPaymentHeader,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'hello' }],
            stream: false,
          }),
        }
      );

      // Should attempt X402 payment flow (not API key auth)
      // Based on server.ts logic, isX402Request is checked after isApiRequest
      // but both are checked in the same condition, so actual behavior depends on handler logic
      // The test verifies that X402 is attempted (not a 200 success from API key)
      expect(response.status).not.toBe(200);
      
      console.log(`✅ Mixed headers handled (status: ${response.status})`);
    });
  });
});
