// Central repository for all test data constants
// This eliminates hardcoded values scattered across multiple files

export const TEST_DATA = {
  // Test user configurations
  users: {
    primary: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'test@example.com',
      name: 'Integration Test User',
      clerkId: 'user_2mP4JRQPpWlDVDPuyrxBxwZU6cM',
    },
    secondary: {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'test2@example.com',
      name: 'Second Test User',
      clerkId: 'user_clerk_test_456',
    },
  },

  // Echo app (OAuth client) configurations
  echoApps: {
    primary: {
      id: '87654321-4321-4321-4321-fedcba987654',
      name: 'Integration Test Client',
      description: 'OAuth client for integration testing',
    },
    secondary: {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Second Integration Test Client',
      description: 'Second OAuth client for cross-client testing',
    },
  },

  // API key configurations
  apiKeys: {
    primary: {
      id: '22222222-2222-2222-2222-222222222222',
      key: 'ek_test_1234567890abcdef',
      name: 'Integration Test API Key',
    },
  },

  // OAuth configuration
  oauth: {
    // Standard callback URLs for testing
    defaultCallbackUrls: [
      'http://localhost:3000/callback',
      'http://localhost:3001/callback',
      'http://localhost:3001/oauth/callback',
    ],

    // Secondary callback URLs for multi-client testing
    secondaryCallbackUrls: [
      'http://localhost:3000/callback',
      'http://localhost:3002/callback',
    ],

    // Default OAuth scope
    defaultScope: 'llm:invoke offline_access',

    // Valid OAuth scopes for testing
    validScopes: ['llm:invoke', 'llm:invoke offline_access', 'offline_access'],

    // Invalid OAuth scopes for negative testing
    invalidScopes: [
      'invalid_scope admin_access',
      'read:all write:all',
      'super_admin',
    ],
  },

  // Payment/billing test data
  payments: {
    testPayment: {
      id: '55555555-5555-5555-5555-555555555555',
      stripePaymentId: 'pi_test_1234567890',
      amount: 1000, // $10.00 in cents
      currency: 'usd',
      status: 'succeeded',
      description: 'Test payment for integration testing',
    },
  },

  // LLM transaction test data
  llmTransactions: {
    testTransaction: {
      id: '66666666-6666-6666-6666-666666666666',
      model: 'claude-3-5-sonnet-20241022',
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      cost: 0.15,
      prompt: 'Test prompt for integration testing',
      response: 'Test response from integration testing',
      status: 'completed',
    },
  },

  // Test timeouts and delays
  timeouts: {
    default: 30000,
    short: 5000,
    long: 60000,
    database: 10000,
  },

  // Browser testing configuration
  browser: {
    defaultTimeout: 30000,
    ciTimeout: 60000,
    retries: 3,
  },

  // Security testing constants
  security: {
    // Valid PKCE code verifier formats
    validCodeVerifiers: {
      minimum: 'a'.repeat(43), // Exactly 43 characters
      maximum: 'a'.repeat(128), // Exactly 128 characters
      mixed:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~', // All valid chars
    },

    // Invalid PKCE code verifiers for negative testing
    invalidCodeVerifiers: [
      'short', // Too short
      'a'.repeat(129), // Too long
      'invalid+chars/not=allowed', // Invalid characters
      'spaces not allowed here', // Contains spaces
      'unicode-δοκιμή-test', // Unicode characters
      'special!@#$%^&*()chars', // Special characters
    ],

    // Invalid code challenge methods
    invalidChallengeMethods: [
      'plain', // Security vulnerability
      'SHA1', // Insecure hash
      'MD5', // Insecure hash
      'invalid', // Unknown method
      's256', // Wrong case
      'Plain', // Wrong case
    ],

    // Invalid response types
    invalidResponseTypes: [
      'token', // Implicit flow
      'id_token', // OpenID Connect implicit
      'code token', // Hybrid flow
      'invalid', // Unknown type
    ],
  },

  // Mock data generators
  generators: {
    /**
     * Generate a random state parameter for OAuth
     */
    generateState(): string {
      return 'test-state-' + Math.random().toString(36).substring(2, 15);
    },

    /**
     * Generate a mock authorization code
     */
    generateMockAuthCode(): string {
      return 'mock_auth_code_' + Math.random().toString(36).substring(2, 15);
    },

    /**
     * Generate a random UUID for testing
     */
    generateTestUuid(): string {
      return (
        '00000000-0000-0000-0000-' +
        Math.random().toString(36).substring(2, 14).padEnd(12, '0')
      );
    },
  },
};

// Convenience exports for backward compatibility
export const TEST_CLIENT_IDS = {
  primary: TEST_DATA.echoApps.primary.id,
  secondary: TEST_DATA.echoApps.secondary.id,
};

export const TEST_USER_IDS = {
  primary: TEST_DATA.users.primary.id,
  secondary: TEST_DATA.users.secondary.id,
};

// Type definitions for test data
export type TestData = typeof TEST_DATA;
export type TestUser = typeof TEST_DATA.users.primary;
export type TestEchoApp = typeof TEST_DATA.echoApps.primary;
export type TestApiKey = typeof TEST_DATA.apiKeys.primary;
