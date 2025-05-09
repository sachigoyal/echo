import dotenv from 'dotenv';

// Load environment variables from .env.test if it exists, otherwise from .env
dotenv.config({ path: '.env.test' });

// Mock OpenAI API responses
jest.mock('node-fetch', () => {
  const originalModule = jest.requireActual('node-fetch');
  return {
    ...originalModule,
    __esModule: true,
    default: jest.fn(),
  };
}); 