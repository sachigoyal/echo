// Export all utility modules for easy importing in tests

export * from './api-client';
export * from './auth-helpers';
export * from './test-data-factory';
export * from './browser-helpers';

// Re-export important types and constants
export type { EchoControlApiClient } from './api-client';

export type {
  OAuthFlowParams,
  OAuthFlowResult,
  SecurityTestParams,
} from './auth-helpers';

export type {
  CreateUserOptions,
  CreateEchoAppOptions,
  CreateApiKeyOptions,
  CreatePaymentOptions,
  CreateLlmTransactionOptions,
} from './test-data-factory';

export type {
  BrowserOAuthFlowOptions,
  BrowserOAuthFlowResult,
} from './browser-helpers';

// Export commonly used instances
export { echoControlApi, TEST_CLIENT_IDS, TEST_USER_IDS } from './api-client';

// Temporarily commented out until Prisma client issue is resolved
// export { testDataFactory } from './test-data-factory';

// Temporarily commented out until Prisma client issue is resolved
// export { TEST_DATA } from '../scripts/seed-integration-db';
