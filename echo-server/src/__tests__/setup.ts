import dotenv from 'dotenv';

// Load environment variables from .env.test if it exists, otherwise from .env
dotenv.config({ path: '.env.test' });

// Mock the EchoControlService
jest.mock('../services/EchoControlService', () => {
  return {
    EchoControlService: jest.fn().mockImplementation(() => ({
      verifyApiKey: jest.fn(),
      getBalance: jest.fn(),
      createTransaction: jest.fn(),
      getUserId: jest.fn(),
      getEchoAppId: jest.fn(),
      getUser: jest.fn(),
      getEchoApp: jest.fn(),
      getAuthResult: jest.fn()
    }))
  };
});

// Mock fetch globally (for both outbound API calls and echo-control calls)
global.fetch = jest.fn(); 