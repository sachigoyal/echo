import { storeApiKey, getStoredApiKey, removeStoredApiKey, validateApiKey } from '../auth';
import * as keytar from 'keytar';

// Mock keytar
jest.mock('keytar');
const mockedKeytar = keytar as jest.Mocked<typeof keytar>;

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateApiKey', () => {
    it('should validate correct API key format', () => {
      const validKeys = [
        'echo_1234567890',
        'echo_abcdef1234567890',
        'echo_test_key_with_underscores',
      ];

      validKeys.forEach(key => {
        expect(validateApiKey(key)).toBe(true);
      });
    });

    it('should reject invalid API key formats', () => {
      const invalidKeys = [
        'invalid_key',
        'echo_',
        'echo_123',
        'not_echo_key',
        '',
        'ECHO_1234567890', // Wrong case
        'echo-1234567890', // Wrong separator
      ];

      invalidKeys.forEach(key => {
        expect(validateApiKey(key)).toBe(false);
      });
    });

    it('should handle null and undefined', () => {
      expect(validateApiKey(null as any)).toBe(false);
      expect(validateApiKey(undefined as any)).toBe(false);
    });
  });

  describe('storeApiKey', () => {
    it('should store API key successfully', async () => {
      const apiKey = 'echo_test_api_key_12345';
      mockedKeytar.setPassword.mockResolvedValue();

      await storeApiKey(apiKey);

      expect(mockedKeytar.setPassword).toHaveBeenCalledWith(
        'echo-sdk',
        'api-key',
        apiKey
      );
    });

    it('should handle storage errors', async () => {
      const apiKey = 'echo_test_api_key_12345';
      const error = new Error('Storage failed');
      mockedKeytar.setPassword.mockRejectedValue(error);

      await expect(storeApiKey(apiKey)).rejects.toThrow('Failed to store API key: Error: Storage failed');
    });

    it('should store different API keys', async () => {
      const apiKeys = [
        'echo_key_1',
        'echo_key_2',
        'echo_key_3',
      ];

      mockedKeytar.setPassword.mockResolvedValue();

      for (const key of apiKeys) {
        await storeApiKey(key);
        expect(mockedKeytar.setPassword).toHaveBeenLastCalledWith(
          'echo-sdk',
          'api-key',
          key
        );
      }
    });
  });

  describe('getStoredApiKey', () => {
    it('should retrieve stored API key', async () => {
      const apiKey = 'echo_test_api_key_12345';
      mockedKeytar.getPassword.mockResolvedValue(apiKey);

      const result = await getStoredApiKey();

      expect(result).toBe(apiKey);
      expect(mockedKeytar.getPassword).toHaveBeenCalledWith(
        'echo-sdk',
        'api-key'
      );
    });

    it('should return null when no key is stored', async () => {
      mockedKeytar.getPassword.mockResolvedValue(null);

      const result = await getStoredApiKey();

      expect(result).toBeNull();
    });

    it('should handle retrieval errors gracefully', async () => {
      const error = new Error('Keychain access denied');
      mockedKeytar.getPassword.mockRejectedValue(error);

      const result = await getStoredApiKey();

      expect(result).toBeNull();
    });

    it('should handle undefined return from keytar', async () => {
      mockedKeytar.getPassword.mockResolvedValue(undefined as any);

      const result = await getStoredApiKey();

      expect(result).toBeNull();
    });
  });

  describe('removeStoredApiKey', () => {
    it('should remove stored API key successfully', async () => {
      mockedKeytar.deletePassword.mockResolvedValue(true);

      await removeStoredApiKey();

      expect(mockedKeytar.deletePassword).toHaveBeenCalledWith(
        'echo-sdk',
        'api-key'
      );
    });

    it('should handle removal errors gracefully', async () => {
      const error = new Error('Deletion failed');
      mockedKeytar.deletePassword.mockRejectedValue(error);

      // Should not throw an error
      await expect(removeStoredApiKey()).resolves.toBeUndefined();
    });

    it('should handle case when no key exists to remove', async () => {
      mockedKeytar.deletePassword.mockResolvedValue(false);

      await expect(removeStoredApiKey()).resolves.toBeUndefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should store and retrieve the same API key', async () => {
      const apiKey = 'echo_integration_test_key_12345';
      
      mockedKeytar.setPassword.mockResolvedValue();
      mockedKeytar.getPassword.mockResolvedValue(apiKey);

      await storeApiKey(apiKey);
      const retrieved = await getStoredApiKey();

      expect(retrieved).toBe(apiKey);
    });

    it('should handle store, retrieve, and remove cycle', async () => {
      const apiKey = 'echo_cycle_test_key_12345';
      
      // Store
      mockedKeytar.setPassword.mockResolvedValue();
      await storeApiKey(apiKey);
      
      // Retrieve
      mockedKeytar.getPassword.mockResolvedValue(apiKey);
      const retrieved = await getStoredApiKey();
      expect(retrieved).toBe(apiKey);
      
      // Remove
      mockedKeytar.deletePassword.mockResolvedValue(true);
      await removeStoredApiKey();
      
      // Verify removal
      mockedKeytar.getPassword.mockResolvedValue(null);
      const afterRemoval = await getStoredApiKey();
      expect(afterRemoval).toBeNull();
    });
  });
}); 