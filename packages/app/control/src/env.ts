import { createEnv } from '@t3-oss/env-nextjs'; // or core package
import { z } from 'zod';

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    // api keys

    API_KEY_PREFIX: z.string().default('echo_'),
    API_KEY_HASH_SECRET:
      process.env.NODE_ENV === 'production'
        ? z.string()
        : z.string().default('api-key-hash-secret-change-in-production'),
    API_ECHO_ACCESS_JWT_SECRET:
      process.env.NODE_ENV === 'production'
        ? z.string()
        : z.string().default('api-echo-access-jwt-secret-change-in-production'),

    // database

    DATABASE_URL: z.url(),

    // auth

    AUTH_SECRET: z.string(),

    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),

    AUTH_GITHUB_ID: z.string(),
    AUTH_GITHUB_SECRET: z.string(),

    AUTH_RESEND_KEY: z.string(),
    AUTH_RESEND_FROM_EMAIL: z.email(),

    // stripe

    STRIPE_SECRET_KEY: z.string(),
    STRIPE_PUBLISHABLE_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    WEBHOOK_URL: z.url(),

    // telemetry

    SIGNOZ_INGESTION_KEY: z.string(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().default('https://ingest.signoz.io'),
    SIGNOZ_SERVICE_NAME: z.string().default('echo-control'),

    // blob storage

    BLOB_READ_WRITE_TOKEN: z.string(),

    // x402

    NETWORK: z.string(),
    RESOURCE_WALLET_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
      message: 'RESOURCE_WALLET_ADDRESS must be a valid Ethereum address',
    }),

    // github

    GITHUB_TOKEN: z.string(),

    // free tier

    LATEST_FREE_TIER_CREDITS_ISSUANCE_AMOUNT: z.coerce.number().positive(),
    LATEST_FREE_TIER_CREDITS_ISSUANCE_VERSION: z.coerce.number().positive(),
    LATEST_TERMS_AND_SERVICES_VERSION: z.coerce.number().positive(),
    LATEST_PRIVACY_POLICY_VERSION: z.coerce.number().positive(),

    // node environment

    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    // oauth

    OAUTH_CODE_SIGNING_JWT_SECRET:
      process.env.NODE_ENV === 'production'
        ? z.string()
        : z.string().default('your-secret-key-change-in-production'),
    OAUTH_REFRESH_TOKEN_EXPIRY_SECONDS: z.coerce.number().positive().default(1),
    OAUTH_ACCESS_TOKEN_EXPIRY_SECONDS: z.coerce.number().positive().default(1),
    OAUTH_REFRESH_TOKEN_ARCHIVE_GRACE_MS: z.coerce
      .number()
      .positive()
      .default(
        process.env.NODE_ENV === 'test' ||
          process.env.INTEGRATION_TEST_MODE === 'true'
          ? 0
          : 2 * 60 * 1000
      ),

    // integration tests

    INTEGRATION_TEST_MODE: z.boolean().default(false),

    // merit

    MERIT_API_KEY: z.string(),
    MERIT_BASE_URL: z.url(),
    MERIT_CHECKOUT_URL: z.url(),
    MERIT_SENDER_GITHUB_ID: z.coerce.number(),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
    NEXT_PUBLIC_POSTHOG_KEY:
      process.env.NODE_ENV === 'production'
        ? z.string()
        : z.string().optional(),
    NEXT_PUBLIC_NODE_ENV: z.string().default('development'),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
});
