import { describe, test, expect, beforeAll } from 'vitest';

describe('Basic Connectivity Test', () => {
  beforeAll(async () => {
    console.log('🔧 Starting basic connectivity tests...');
  });

  test('environment variables are loaded', () => {
    expect(process.env.ECHO_CONTROL_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.CLERK_SECRET_KEY).toBeDefined();
  });

  test('can import utility functions', async () => {
    const { generateCodeVerifier, generateState } = await import(
      '../../utils/auth-helpers.js'
    );
    const { echoControlApi } = await import('../../utils/api-client.js');

    expect(echoControlApi).toBeDefined();
    expect(typeof generateCodeVerifier).toBe('function');
    expect(typeof generateState).toBe('function');

    // Test utility functions work
    const verifier = generateCodeVerifier();
    const state = generateState();

    expect(verifier).toMatch(/^[A-Za-z0-9._~-]{43,128}$/);
    expect(state).toBeTruthy();
    expect(state.length).toBeGreaterThan(0);
  });

  test('can reach echo-control health endpoint', async () => {
    const response = await fetch(`${process.env.ECHO_CONTROL_URL}/api/health`);
    expect(response.ok).toBe(true);

    const health = await response.json();
    expect(health).toHaveProperty('status');
  });
});
