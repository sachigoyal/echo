// Mock keytar for testing authentication
jest.mock('keytar', () => ({
  setPassword: jest.fn().mockResolvedValue(undefined),
  getPassword: jest.fn().mockResolvedValue(null),
  deletePassword: jest.fn().mockResolvedValue(true),
}));

// Mock process.exit to prevent tests from actually exiting
beforeEach(() => {
  jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`Process.exit called with code: ${code}`);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Export utilities for tests
export const TEST_SERVER_URL = 'http://localhost:3001';
export const TEST_API_KEY = 'echo_test_api_key_12345';
export const INVALID_API_KEY = 'invalid_key'; 