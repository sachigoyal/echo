import { describe, test, expect, beforeAll } from 'vitest';
import OpenAI from 'openai';
import {
  TEST_CONFIG,
  echoControlApi,
  TEST_CLIENT_IDS,
} from '../../utils/index.js';

describe('Echo Data Server Client Integration Tests', () => {
  beforeAll(async () => {
    console.log('🔧 Starting Echo Data Server client tests...');
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

  async function getAccessTokenForPaidUser(): Promise<string> {
    // Primary user has payments, so they are the "paid" user
    // Use their primary client that they are a member of
    const { generateCodeVerifier, generateCodeChallenge, generateState } =
      await import('../../utils/auth-helpers.js');

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    console.log(
      `🔑 Getting authorization code for paid user (primary user with primary client)...`
    );

    const redirectUrl = await echoControlApi.validateOAuthAuthorizeRequest({
      client_id: TEST_CLIENT_IDS.primary,
      redirect_uri: 'http://localhost:3000/callback',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      scope: 'llm:invoke offline_access',
      prompt: 'none', // Skip consent page for automated testing
    });

    // Extract authorization code from callback URL
    const callbackUrl = new URL(redirectUrl);
    const authCode = callbackUrl.searchParams.get('code');
    expect(authCode).toBeTruthy();

    // Exchange authorization code for tokens
    console.log('🔄 Exchanging auth code for access token...');

    const tokenResponse = await echoControlApi.exchangeCodeForToken({
      code: authCode!,
      client_id: TEST_CLIENT_IDS.primary,
      redirect_uri: 'http://localhost:3000/callback',
      code_verifier: codeVerifier,
    });

    expect(tokenResponse.access_token).toBeTruthy();
    console.log('✅ Got valid access token for paid user (primary user)');
    console.log(
      '🔍 Access token (first 50 chars):',
      tokenResponse.access_token!.substring(0, 50) + '...'
    );

    return tokenResponse.access_token!;
  }

  test('Should create a valid echo access jwt for paid user', async () => {
    const accessToken = await getAccessTokenForPaidUser();
    expect(accessToken).toBeTruthy();
  });

  describe('Non-streaming Chat Completions', () => {
    test('should successfully make a non-streaming chat completion request', async () => {
      // Get a valid access token for the paid user
      const accessToken = await getAccessTokenForPaidUser();

      const balanceCheck = await echoControlApi.getBalance(accessToken);
      expect(balanceCheck.totalPaid).toBeGreaterThan(0);

      // Initialize OpenAI client with the valid access token
      const openaiClient = new OpenAI({
        baseURL: TEST_CONFIG.services.echoDataServer,
        apiKey: accessToken,
      });

      const completion = await openaiClient.chat.completions.create({
        messages: [
          { role: 'user', content: 'Tell me a short story about a cat!' },
        ],
        model: 'gpt-3.5-turbo',
        stream: false,
      });

      expect(completion).toBeDefined();
      expect(completion.choices).toBeDefined();
      expect(completion.choices.length).toBeGreaterThan(0);
      expect(completion.choices[0]).toHaveProperty('message');
      expect(completion.choices[0]?.message).toHaveProperty('content');
      expect(typeof completion.choices[0]?.message?.content).toBe('string');
      expect(completion.choices[0]?.message?.content).toBeTruthy();
      expect(completion.choices[0]?.message?.content!.length).toBeGreaterThan(
        0
      );

      const secondBalanceCheck = await echoControlApi.getBalance(accessToken);
      expect(secondBalanceCheck.totalPaid).toBe(balanceCheck.totalPaid);
      expect(secondBalanceCheck.totalSpent).toBeGreaterThan(
        balanceCheck.totalSpent
      );
      expect(secondBalanceCheck.balance).toBeLessThan(balanceCheck.balance);

      console.log(
        '✅ Paid user (primary user) successfully made LLM request and balance is updated'
      );
    });

    describe('Streaming Chat Completions', () => {
      test('should successfully make a streaming chat completion request', async () => {
        const accessToken = await getAccessTokenForPaidUser();

        const balanceCheck = await echoControlApi.getBalance(accessToken);
        expect(balanceCheck.totalPaid).toBeGreaterThan(0);

        const openaiClient = new OpenAI({
          baseURL: TEST_CONFIG.services.echoDataServer,
          apiKey: accessToken,
        });

        const stream = await openaiClient.chat.completions.create({
          messages: [
            { role: 'user', content: 'Tell me a short story about a cat!' },
          ],
          model: 'gpt-3.5-turbo',
          stream: true,
        });

        expect(stream).toBeDefined();

        let receivedContent = '';
        let chunkCount = 0;

        for await (const chunk of stream) {
          chunkCount++;
          expect(chunk).toBeDefined();
          expect(chunk.choices).toBeDefined();
          const content = chunk.choices[0]?.delta?.content || '';
          receivedContent += content;
        }

        expect(chunkCount).toBeGreaterThan(0);
        expect(receivedContent.length).toBeGreaterThan(0);

        const secondBalanceCheck = await echoControlApi.getBalance(accessToken);
        expect(secondBalanceCheck.totalPaid).toBe(balanceCheck.totalPaid);
        expect(secondBalanceCheck.totalSpent).toBeGreaterThan(
          balanceCheck.totalSpent
        );
        expect(secondBalanceCheck.balance).toBeLessThan(balanceCheck.balance);

        console.log(
          '✅ Paid user (primary user) successfully made streaming LLM request and balance is updated'
        );
      });
    });
  });
});
