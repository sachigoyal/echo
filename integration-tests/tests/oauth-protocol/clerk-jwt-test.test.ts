import { describe, test, expect, beforeAll } from 'vitest';
import {
  TEST_CLIENT_IDS,
  TEST_USER_IDS,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from '../../utils/index.js';
import { SignJWT } from 'jose';

describe('Clerk JWT Authentication Test', () => {
  beforeAll(async () => {
    expect(process.env.CLERK_SECRET_KEY).toBeTruthy();
  });

  test('creates proper Clerk JWT token for integ_test_template', async () => {
    console.log('🔧 Creating Clerk JWT token...');

    // Use Clerk secret key
    const clerkSecret = new TextEncoder().encode(
      process.env.CLERK_SECRET_KEY ||
        'sk_test_j7lWMXoB0AoqZwNtlhXxvcGsLKF35xzar8dzkNLNHi'
    );

    const now = Math.floor(Date.now() / 1000);

    // Create JWT following Clerk's template format
    const clerkJwt = await new SignJWT({
      // Standard JWT claims
      iss: 'https://honest-dory-13.clerk.accounts.dev', // Issuer from publishable key
      sub: 'user_clerk_test_123', // Subject (user ID)
      aud: 'integ_test_template', // Audience (our template name)
      exp: now + 3600, // Expires in 1 hour
      iat: now, // Issued at
      nbf: now, // Not before

      // Clerk-specific claims
      sid: 'sess_test_integration_session', // Session ID
      template: 'integ_test_template', // Template name

      // User context for OAuth
      user_id: TEST_USER_IDS.primary, // Database user ID
      clerk_id: 'user_clerk_test_123', // Clerk user ID

      // Custom claims for testing
      scope: 'oauth:authorize',
    })
      .setProtectedHeader({
        alg: 'HS256',
        typ: 'JWT',
        kid: 'ins_2mP3tKz7p2J4gVawwoYnGYZZHun', // Add the Key ID that Clerk expects
      })
      .sign(clerkSecret);

    console.log('✅ Created Clerk JWT token');
    console.log('🔑 Token preview:', clerkJwt.substring(0, 100) + '...');

    // Test the JWT with OAuth authorize
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    console.log('🔧 Testing OAuth authorize with Clerk JWT...');

    const response = await fetch(
      `${process.env.ECHO_CONTROL_URL}/api/oauth/authorize?` +
        new URLSearchParams({
          response_type: 'code',
          client_id: TEST_CLIENT_IDS.primary,
          redirect_uri: 'http://localhost:3000/callback',
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          scope: 'llm:invoke offline_access',
        }),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${clerkJwt}`,
        },
        redirect: 'manual',
      }
    );

    console.log('📍 Response status:', response.status);
    console.log(
      '📍 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    const location = response.headers.get('location') || '';
    console.log('📍 Redirect location:', location);

    // Check if we got a real OAuth callback
    if (location.includes('/callback')) {
      const callbackUrl = new URL(location);
      const authCode = callbackUrl.searchParams.get('code');

      if (authCode) {
        console.log('🎉 SUCCESS! Got authorization code with Clerk JWT!');
        console.log('🔑 Auth code preview:', authCode.substring(0, 50) + '...');
        expect(authCode).toBeTruthy();
      } else {
        console.log('❌ Callback URL but no auth code');
        expect.fail('Got callback redirect but no authorization code');
      }
    } else if (location.includes('/sign-in')) {
      console.log(
        '❌ Still redirecting to sign-in - JWT authentication failed'
      );
      expect.fail(
        'Clerk JWT did not authenticate - still redirected to sign-in'
      );
    } else {
      console.log('🤔 Unknown redirect:', location);
      expect.fail(`Unexpected redirect: ${location}`);
    }
  });
});
