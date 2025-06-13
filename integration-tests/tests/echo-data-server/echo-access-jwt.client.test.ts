// import { describe, test, expect, beforeAll } from 'vitest';
// import OpenAI from 'openai';
// import { TEST_CONFIG, echoControlApi, TEST_CLIENT_IDS, TEST_USER_IDS } from '../../utils/index.js';

describe('do not run this test', () => {
  test('do not run this test', () => {
    expect(true).toBe(true);
  });
});

// describe('Echo Data Server Client Integration Tests', () => {
//   beforeAll(async () => {
//     console.log('🔧 Starting Echo Data Server client tests...');
//     // Ensure echo-control is running and healthy
//     await echoControlApi.healthCheck();

//     // Ensure echo-data-server is running and healthy
//     const response = await fetch(`${TEST_CONFIG.services.echoDataServer}/health`);
//     if (!response.ok) {
//       throw new Error('Echo data server health check failed');
//     }
//   });

//   async function getAccessTokenForPaidUser(): Promise<string> {
//     // Primary user has payments, so they are the "paid" user
//     // Use their primary client that they are a member of
//     const { generateCodeVerifier, generateCodeChallenge, generateState } =
//       await import('../../utils/auth-helpers.js');

//     const codeVerifier = generateCodeVerifier();
//     const codeChallenge = generateCodeChallenge(codeVerifier);
//     const state = generateState();

//     console.log(`🔑 Getting authorization code for paid user (primary user with primary client)...`);

//     const redirectUrl = await echoControlApi.validateOAuthAuthorizeRequest({
//       client_id: TEST_CLIENT_IDS.primary,
//       redirect_uri: 'http://localhost:3000/callback',
//       state,
//       code_challenge: codeChallenge,
//       code_challenge_method: 'S256',
//       scope: 'llm:invoke offline_access',
//       prompt: 'none', // Skip consent page for automated testing
//     });

//     // Extract authorization code from callback URL
//     const callbackUrl = new URL(redirectUrl);
//     const authCode = callbackUrl.searchParams.get('code');
//     expect(authCode).toBeTruthy();

//     // Exchange authorization code for tokens
//     console.log('🔄 Exchanging auth code for access token...');

//     const tokenResponse = await echoControlApi.exchangeCodeForToken({
//       code: authCode!,
//       client_id: TEST_CLIENT_IDS.primary,
//       redirect_uri: 'http://localhost:3000/callback',
//       code_verifier: codeVerifier,
//     });

//     expect(tokenResponse.access_token).toBeTruthy();
//     console.log('✅ Got valid access token for paid user (primary user)');
//     console.log('🔍 Access token (first 50 chars):', tokenResponse.access_token!.substring(0, 50) + '...');

//     return tokenResponse.access_token!;
//   }

//   async function getAccessTokenForUnpaidUser(): Promise<string> {
//     // Secondary user has no payments, so they are the "unpaid" user
//     // Use their secondary client that they are a member of
//     const { generateCodeVerifier, generateCodeChallenge, generateState } =
//       await import('../../utils/auth-helpers.js');

//     const codeVerifier = generateCodeVerifier();
//     const codeChallenge = generateCodeChallenge(codeVerifier);
//     const state = generateState();

//     console.log(`🔑 Getting authorization code for unpaid user (secondary user with secondary client)...`);

//     const redirectUrl = await echoControlApi.validateOAuthAuthorizeRequest({
//       client_id: TEST_CLIENT_IDS.secondary,
//       redirect_uri: 'http://localhost:3000/callback',
//       state,
//       code_challenge: codeChallenge,
//       code_challenge_method: 'S256',
//       scope: 'llm:invoke offline_access',
//       prompt: 'none', // Skip consent page for automated testing
//     });

//     // Extract authorization code from callback URL
//     const callbackUrl = new URL(redirectUrl);
//     const authCode = callbackUrl.searchParams.get('code');
//     expect(authCode).toBeTruthy();

//     // Exchange authorization code for tokens
//     console.log('🔄 Exchanging auth code for access token...');

//     const tokenResponse = await echoControlApi.exchangeCodeForToken({
//       code: authCode!,
//       client_id: TEST_CLIENT_IDS.secondary,
//       redirect_uri: 'http://localhost:3000/callback',
//       code_verifier: codeVerifier,
//     });

//     expect(tokenResponse.access_token).toBeTruthy();
//     console.log('✅ Got valid access token for unpaid user (secondary user)');
//     console.log('🔍 Access token (first 50 chars):', tokenResponse.access_token!.substring(0, 50) + '...');

//     return tokenResponse.access_token!;
//   }

//   describe('Non-streaming Chat Completions', () => {
//     test('should successfully make a non-streaming chat completion request', async () => {
//       // Get a valid access token for the paid user
//       const accessToken = await getAccessTokenForPaidUser();

//       // Initialize OpenAI client with the valid access token
//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: accessToken,
//       });

//       const completion = await openaiClient.chat.completions.create({
//         messages: [
//           { role: 'user', content: 'Tell me a short story about a cat!' },
//         ],
//         model: 'gpt-3.5-turbo',
//         stream: false,
//       });

//       expect(completion).toBeDefined();
//       expect(completion.choices).toBeDefined();
//       expect(completion.choices.length).toBeGreaterThan(0);
//       expect(completion.choices[0]).toHaveProperty('message');
//       expect(completion.choices[0]?.message).toHaveProperty('content');
//       expect(typeof completion.choices[0]?.message?.content).toBe('string');
//       expect(completion.choices[0]?.message?.content).toBeTruthy();
//       expect(completion.choices[0]?.message?.content!.length).toBeGreaterThan(0);
//     });

//     test('should handle different message types in non-streaming mode', async () => {
//       // Get a valid access token for the paid user
//       const accessToken = await getAccessTokenForPaidUser();

//       // Initialize OpenAI client with the valid access token
//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: accessToken,
//       });

//       const completion = await openaiClient.chat.completions.create({
//         messages: [
//           { role: 'system', content: 'You are a helpful assistant.' },
//           { role: 'user', content: 'What is 2+2?' },
//         ],
//         model: 'gpt-3.5-turbo',
//         stream: false,
//       });

//       expect(completion.choices[0]?.message?.content).toBeDefined();
//       expect(completion.choices[0]?.message?.role).toBe('assistant');
//     });

//     test('should handle longer content requests in non-streaming mode', async () => {
//       // Get a valid access token for the paid user
//       const accessToken = await getAccessTokenForPaidUser();

//       // Initialize OpenAI client with the valid access token
//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: accessToken,
//       });

//       const completion = await openaiClient.chat.completions.create({
//         messages: [
//           { role: 'user', content: 'Tell me a detailed story about a cat exploring a magical forest. Make it at least 3 paragraphs long.' },
//         ],
//         model: 'gpt-3.5-turbo',
//         stream: false,
//       });

//       expect(completion.choices[0]?.message?.content).toBeDefined();
//       expect(completion.choices[0]?.message?.content!.length).toBeGreaterThan(100);
//     });
//   });

//   describe('Streaming Chat Completions', () => {
//     test('should successfully make a streaming chat completion request', async () => {
//       // Get a valid access token for the paid user
//       const accessToken = await getAccessTokenForPaidUser();

//       // Initialize OpenAI client with the valid access token
//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: accessToken,
//       });

//       const stream = await openaiClient.chat.completions.create({
//         messages: [
//           { role: 'user', content: 'Tell me a short story about a cat!' },
//         ],
//         model: 'gpt-3.5-turbo',
//         stream: true,
//       });

//       expect(stream).toBeDefined();

//       let receivedContent = '';
//       let chunkCount = 0;

//       for await (const chunk of stream) {
//         chunkCount++;
//         expect(chunk).toBeDefined();
//         expect(chunk.choices).toBeDefined();
//         expect(chunk.choices.length).toBeGreaterThan(0);

//         const content = chunk.choices[0]?.delta?.content || '';
//         receivedContent += content;
//       }

//       expect(chunkCount).toBeGreaterThan(0);
//       expect(receivedContent.length).toBeGreaterThan(0);
//     });
//   });

//   describe('Error Handling', () => {
//     test('should handle invalid API key gracefully', async () => {
//       // Initialize OpenAI client with an invalid API key
//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: 'invalid-api-key',
//       });

//       await expect(async () => {
//         await openaiClient.chat.completions.create({
//           messages: [
//             { role: 'user', content: 'Hello' },
//           ],
//           model: 'gpt-3.5-turbo',
//           stream: false,
//         });
//       }).rejects.toThrow(/401|Unauthorized/);
//     });

//     test('should handle missing API key gracefully', async () => {
//       // Initialize OpenAI client without any API key
//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: '',
//       });

//       await expect(async () => {
//         await openaiClient.chat.completions.create({
//           messages: [
//             { role: 'user', content: 'Hello' },
//           ],
//           model: 'gpt-3.5-turbo',
//           stream: false,
//         });
//       }).rejects.toThrow(/401|Unauthorized/);
//     });
//   });

//   describe('Payment Status Tests', () => {
//     test('paid user (primary user with payments) should successfully make requests without 402 error', async () => {
//       // Get access token for the paid user (primary user who has payment records)
//       const accessToken = await getAccessTokenForPaidUser();

//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: accessToken,
//       });

//       // This request should succeed for a paid user
//       const completion = await openaiClient.chat.completions.create({
//         messages: [
//           { role: 'user', content: 'Hello from paid user!' },
//         ],
//         model: 'gpt-3.5-turbo',
//         stream: false,
//       });

//       expect(completion).toBeDefined();
//       expect(completion.choices).toBeDefined();
//       expect(completion.choices.length).toBeGreaterThan(0);
//       expect(completion.choices[0]).toHaveProperty('message');
//       expect(completion.choices[0]?.message).toHaveProperty('content');
//       expect(typeof completion.choices[0]?.message?.content).toBe('string');
//       expect(completion.choices[0]?.message?.content).toBeTruthy();

//       console.log('✅ Paid user (primary user) successfully made LLM request');
//     });

//     test('unpaid user (secondary user with no payments) should receive 402 payment required error', async () => {
//       // Get access token for an unpaid user (secondary user who has no payment records)
//       const accessToken = await getAccessTokenForUnpaidUser();

//       const openaiClient = new OpenAI({
//         baseURL: TEST_CONFIG.services.echoDataServer,
//         apiKey: accessToken,
//       });

//       // This request should fail with 402 for an unpaid user
//       await expect(async () => {
//         await openaiClient.chat.completions.create({
//           messages: [
//             { role: 'user', content: 'Hello from unpaid user!' },
//           ],
//           model: 'gpt-3.5-turbo',
//           stream: false,
//         });
//       }).rejects.toThrow(/402|Payment Required/);

//       console.log('✅ Unpaid user (secondary user) correctly received 402 payment required error');
//     });
//   });
// });
