import { describe, test, expect, beforeAll } from 'vitest';
import {
  echoControlApi,
  TEST_CLIENT_IDS,
  TEST_CONFIG,
} from '../../utils/index.js';

describe('OAuth Refresh Token Tests', () => {
  beforeAll(async () => {
    // Ensure echo-control is running and healthy
    await echoControlApi.healthCheck();
  });

  describe('Grant Type Validation', () => {
    test('rejects invalid grant types', async () => {
      await expect(
        echoControlApi.refreshToken({
          refresh_token: 'test-refresh-token',
          client_id: TEST_CLIENT_IDS.primary,
        })
      ).rejects.toThrow(/invalid.*grant|unsupported.*grant|refresh.*token/i);
    });

    test('rejects missing grant type in custom request', async () => {
      // Test direct API call without grant_type to ensure server validation
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: 'test-refresh-token',
            client_id: TEST_CLIENT_IDS.primary,
            // Missing grant_type
          }),
        }
      );

      expect(response.ok).toBe(false);
      const errorData = await response.json();
      expect(errorData.error).toMatch(
        /unsupported.*grant.*type|invalid.*request|grant.*type.*required/i
      );
    });

    test('rejects wrong grant type in custom request', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code', // Wrong type
            refresh_token: 'test-refresh-token',
            client_id: TEST_CLIENT_IDS.primary,
          }),
        }
      );

      expect(response.ok).toBe(false);
      const errorData = await response.json();
      expect(errorData.error).toMatch(/unsupported.*grant.*type/i);
    });
  });

  describe('Refresh Token Validation', () => {
    test('rejects missing refresh token', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            client_id: TEST_CLIENT_IDS.primary,
            // Missing refresh_token
          }),
        }
      );

      expect(response.ok).toBe(false);
      const errorData = await response.json();
      expect(errorData.error).toMatch(
        /invalid.*request|refresh.*token.*required/i
      );
    });

    test('rejects empty refresh token', async () => {
      await expect(
        echoControlApi.refreshToken({
          refresh_token: '',
          client_id: TEST_CLIENT_IDS.primary,
        })
      ).rejects.toThrow(/invalid.*grant|invalid.*token|refresh.*token/i);
    });

    test('rejects invalid refresh token format', async () => {
      const invalidTokens = [
        'invalid-token',
        'not.a.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      ];

      for (const token of invalidTokens) {
        await expect(
          echoControlApi.refreshToken({
            refresh_token: token,
            client_id: TEST_CLIENT_IDS.primary,
          })
        ).rejects.toThrow(/invalid.*grant|invalid.*token|refresh.*token/i);
      }
    });

    test('rejects non-existent refresh token', async () => {
      // Generate a valid JWT structure but non-existent in database
      const nonExistentToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(
          JSON.stringify({
            sub: 'non-existent-user',
            jti: 'non-existent-token-id',
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
          })
        ).toString('base64url') +
        '.fake-signature';

      await expect(
        echoControlApi.refreshToken({
          refresh_token: nonExistentToken,
          client_id: TEST_CLIENT_IDS.primary,
        })
      ).rejects.toThrow(/invalid.*grant|token.*not.*found|invalid.*token/i);
    });
  });

  describe('Client Validation', () => {
    test('rejects missing client_id', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: 'test-refresh-token',
            // Missing client_id
          }),
        }
      );

      expect(response.ok).toBe(false);
      const errorData = await response.json();
      expect(errorData.error).toMatch(
        /invalid.*grant|invalid.*request|client.*id.*required/i
      );
    });

    test('rejects invalid client_id format', async () => {
      const invalidClientIds = [
        '',
        'invalid-uuid',
        '12345',
        'not-a-uuid-at-all',
      ];

      for (const clientId of invalidClientIds) {
        await expect(
          echoControlApi.refreshToken({
            refresh_token: 'test-refresh-token',
            client_id: clientId,
          })
        ).rejects.toThrow(
          /invalid.*grant|invalid.*client|client.*not.*found|invalid.*request/i
        );
      }
    });

    test('rejects non-existent client_id', async () => {
      await expect(
        echoControlApi.refreshToken({
          refresh_token: 'test-refresh-token',
          client_id: '99999999-9999-9999-9999-999999999999', // Non-existent
        })
      ).rejects.toThrow(/invalid.*grant|invalid.*client|client.*not.*found/i);
    });
  });

  describe('Content-Type Handling', () => {
    test('supports application/json content-type', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: 'test-refresh-token',
            client_id: TEST_CLIENT_IDS.primary,
          }),
        }
      );

      // Should fail due to invalid token, not content-type
      expect(response.ok).toBe(false);
      const errorData = await response.json();
      expect(errorData.error).not.toMatch(/content.*type|unsupported.*media/i);
      expect(errorData.error).toMatch(/invalid.*grant|invalid.*token/i);
    });

    test('supports application/x-www-form-urlencoded content-type', async () => {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'test-refresh-token',
        client_id: TEST_CLIENT_IDS.primary,
      });

      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      // Should fail due to invalid token, not content-type
      expect(response.ok).toBe(false);
      const errorData = await response.json();
      expect(errorData.error).not.toMatch(/content.*type|unsupported.*media/i);
      expect(errorData.error).toMatch(
        /invalid.*grant|invalid.*token|server.*error/i
      );
    });

    test('rejects unsupported content-types', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: 'invalid body',
        }
      );

      expect(response.ok).toBe(false);
      const errorData = await response.json();
      expect(errorData.error).toMatch(
        /invalid.*request|unsupported.*media|content.*type|server.*error/i
      );
    });
  });

  describe('HTTP Method Validation', () => {
    test('rejects GET requests', async () => {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'test-refresh-token',
        client_id: TEST_CLIENT_IDS.primary,
      });

      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(405); // Method Not Allowed
    });

    test('rejects PUT requests', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: 'test-refresh-token',
            client_id: TEST_CLIENT_IDS.primary,
          }),
        }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(405); // Method Not Allowed
    });
  });

  describe('Error Response Format', () => {
    test('returns consistent OAuth error format', async () => {
      const response = await fetch(
        `${TEST_CONFIG.services.echoControl}/api/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'invalid_grant_type',
            refresh_token: 'test-refresh-token',
            client_id: TEST_CLIENT_IDS.primary,
          }),
        }
      );

      expect(response.ok).toBe(false);
      const errorData = await response.json();

      // OAuth 2.0 spec requires 'error' field
      expect(errorData).toHaveProperty('error');
      expect(typeof errorData.error).toBe('string');

      // May also have error_description
      if (errorData.error_description) {
        expect(typeof errorData.error_description).toBe('string');
      }
    });
  });
});
