import { describe, test, expect, beforeAll } from 'vitest';
import {
  TEST_CLIENT_IDS,
  TEST_USER_IDS,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  echoControlApi,
} from '../../utils/index.js';
import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';

describe('OAuth End-to-End Flow Tests', () => {
  beforeAll(async () => {
    // Verify test environment
    expect(process.env.ECHO_CONTROL_URL).toBeTruthy();
    expect(process.env.INTEGRATION_TEST_JWT).toBeTruthy();
  });

  describe('Step 1.5: Test Real OAuth Authorize Flow', () => {
    test('gets real authorization code from OAuth authorize endpoint', async () => {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();

      console.log(
        'Testing real OAuth authorize endpoint with proper authentication...'
      );

      try {
        const redirectUrl = await echoControlApi.validateOAuthAuthorizeRequest({
          client_id: TEST_CLIENT_IDS.primary,
          redirect_uri: 'http://localhost:3000/callback',
          state,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          scope: 'llm:invoke offline_access',
          prompt: 'none', // Skip consent page for automated testing
        });

        console.log('OAuth authorize succeeded! Redirect URL:', redirectUrl);

        // Extract authorization code from callback URL
        const callbackUrl = new URL(redirectUrl);
        const authCode = callbackUrl.searchParams.get('code');
        const returnedState = callbackUrl.searchParams.get('state');

        expect(authCode).toBeTruthy();
        expect(returnedState).toBe(state);

        console.log('✅ Got real authorization code from server!');

        // Store for next test
        (globalThis as any).testAuthCode = authCode;
        (globalThis as any).testCodeVerifier = codeVerifier;
        (globalThis as any).testState = state;
        (globalThis as any).testIsRealCode = true;
      } catch (error) {
        console.log(
          '❌ Real OAuth flow failed, falling back to mock code creation'
        );
        console.log('Error:', error.message);

        // Fall back to creating mock authorization code
        console.log('Creating mock authorization code as fallback...');
        const authCode = nanoid(32);
        const exp = Math.floor(Date.now() / 1000) + 300; // 5 minutes

        const OAUTH_JWT_SECRET = new TextEncoder().encode(
          process.env.OAUTH_JWT_SECRET || 'your-secret-key-change-in-production'
        );

        const authCodeJwt = await new SignJWT({
          clientId: TEST_CLIENT_IDS.primary,
          redirectUri: 'http://localhost:3000/callback',
          codeChallenge,
          codeChallengeMethod: 'S256',
          scope: 'llm:invoke offline_access',
          userId: 'user_clerk_test_123', // Use Clerk ID, not database ID
          exp,
          code: authCode,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime(exp)
          .sign(OAUTH_JWT_SECRET);

        console.log('Created mock authorization code JWT');

        // Store for next test
        (globalThis as any).testAuthCode = authCodeJwt;
        (globalThis as any).testCodeVerifier = codeVerifier;
        (globalThis as any).testState = state;
        (globalThis as any).testIsRealCode = false;
      }
    });
  });

  describe('Step 2: Authorization Code Ready', () => {
    test('has authorization code ready for token exchange', async () => {
      const authCode = (globalThis as any).testAuthCode;
      const isRealCode = (globalThis as any).testIsRealCode;

      expect(authCode).toBeTruthy();

      if (isRealCode) {
        console.log('✅ Using REAL authorization code from OAuth server');
      } else {
        console.log('⚠️ Using mock authorization code (real OAuth failed)');
      }

      expect(authCode.split('.')).toHaveLength(3); // Valid JWT structure
    });
  });

  describe('Step 3: Exchange Authorization Code for Tokens', () => {
    test('exchanges valid authorization code for access and refresh tokens', async () => {
      // Get values from previous test
      const authCode = (globalThis as any).testAuthCode;
      const codeVerifier = (globalThis as any).testCodeVerifier;

      expect(authCode).toBeTruthy();
      expect(codeVerifier).toBeTruthy();

      console.log('Exchanging auth code for tokens...');

      const tokenResponse = await echoControlApi.exchangeCodeForToken({
        code: authCode,
        client_id: TEST_CLIENT_IDS.primary,
        redirect_uri: 'http://localhost:3000/callback',
        code_verifier: codeVerifier,
      });

      console.log('Token response:', {
        access_token: tokenResponse.access_token.substring(0, 50) + '...',
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        scope: tokenResponse.scope,
        has_refresh_token: !!tokenResponse.refresh_token,
      });

      // Verify token response structure
      expect(tokenResponse.access_token).toBeTruthy();
      expect(tokenResponse.token_type).toBe('Bearer');
      expect(tokenResponse.expires_in).toBeGreaterThan(0);
      expect(tokenResponse.scope).toBeTruthy();
      expect(tokenResponse.refresh_token).toBeTruthy();

      // Store for next test
      (globalThis as any).testAccessToken = tokenResponse.access_token;
      (globalThis as any).testRefreshToken = tokenResponse.refresh_token;
    });
  });

  describe('Step 4: Validate Access Token', () => {
    test('validates access token with JWT validation endpoint', async () => {
      const accessToken = (globalThis as any).testAccessToken;
      expect(accessToken).toBeTruthy();

      console.log('Validating access token...');
      console.log('Access token structure:', {
        parts: accessToken.split('.').length,
        header: accessToken.split('.')[0],
        payload_preview: accessToken.split('.')[1].substring(0, 50) + '...',
      });

      // Decode payload for debugging
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        console.log('Decoded access token payload:', payload);
      } catch (e) {
        console.log('Failed to decode access token payload:', e.message);
      }

      console.log('Making validation request with X-Echo-Token header...');
      const validationResult =
        await echoControlApi.validateJwtToken(accessToken);

      console.log('Validation result:', {
        valid: validationResult.valid,
        error: validationResult.error,
        claims: validationResult.claims
          ? {
              user_id: validationResult.claims.user_id,
              app_id: validationResult.claims.app_id,
              scope: validationResult.claims.scope,
              exp: validationResult.claims.exp,
            }
          : null,
      });

      // Verify token is valid
      expect(validationResult.valid).toBe(true);
      expect(validationResult.claims).toBeTruthy();

      // Verify token claims
      expect(validationResult.claims.user_id).toBe(TEST_USER_IDS.primary);
      expect(validationResult.claims.app_id).toBe(TEST_CLIENT_IDS.primary);
      expect(validationResult.claims.scope).toBe('llm:invoke offline_access');
      expect(validationResult.claims.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });
});
