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
    // We need to implement a test for the streaming endpoints
    // This should test: 
    // 1. All providers can stream successfully
    // 2. All providers deduct the correct amount of tokens from the account
    // 3. All providers return the correct content-type
    // 4. All providers return the correct status code
    // 5. All providers return the correct body
  });

  describe('Non-streaming endpoints', () => {
    // We need to implement a test for the non-streaming endpoints
    // This should test: 
    // 1. All providers can handle the request successfully
    // 2. All providers return the correct content-type
    // 3. All providers return the correct status code
    // 4. All providers return the correct body
  })
  

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
  });
}); 