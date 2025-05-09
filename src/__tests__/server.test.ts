import request from 'supertest';
import express from 'express';
import { ReadableStream } from 'stream/web';
import { accountManager } from '../accounting/account';

// Mock the fetch module
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

// Test constants
const TEST_TOKEN = 'this-is-a-foolish-attempt-at-authorization';
const TEST_USER = 'user-ben-reilly';

describe('Server Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Reset account manager state
    accountManager.reset();
    // Set up test account
    accountManager.setAccount(TEST_USER, 100);
    
    // Import the app after mocking
    app = require('../server').default;
  });

  describe('Non-streaming endpoints', () => {
    it('should handle payment required errors', async () => {
      // Set account balance to 0
      accountManager.setAccount(TEST_USER, 0);

      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test prompt' }]
        });

      expect(response.status).toBe(402);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Streaming endpoints', () => {
  });

  describe('Authentication Tests', () => {
    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .post('/chat/completions')
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test prompt' }]
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with invalid authorization format', async () => {
      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', 'InvalidFormat')
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test prompt' }]
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test prompt' }]
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Account Management Tests', () => {
    beforeEach(() => {
      // Set up a test account with some balance
      accountManager.setAccount(TEST_USER, 100);
    });

    it('should reject requests when account has insufficient balance', async () => {
      // Set account balance to 0
      accountManager.setAccount(TEST_USER, 0);

      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test prompt' }]
        });

      expect(response.status).toBe(402);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle streaming requests with account balance updates', async () => {
      const initialBalance = 100;
      accountManager.setAccount(TEST_USER, initialBalance);

      // Create a mock stream with usage data
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Test"}}]}\n\n'));
          controller.close();
        }
      });

      // Mock the OpenAI API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStream,
        headers: {
          get: (name: string) => name === 'content-type' ? 'text/event-stream' : null
        }
      });

      const response = await request(app)
        .post('/chat/completions')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test prompt' }],
          stream: true
        });

      expect(response.status).toBe(200);
      // Verify that the account balance was updated
      expect(accountManager.getAccount(TEST_USER)).toBeLessThan(initialBalance);
    });
  });
}); 