import axios from 'axios';

import { EchoClient } from '../client';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const TEST_SERVER_URL = 'http://localhost:3001';
const TEST_API_KEY = 'echo_test_api_key_12345';

interface ErrorWithResponse extends Error {
  response?: {
    status: number;
    data?: unknown;
  };
  code?: string;
}

describe('EchoClient', () => {
  let client: EchoClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      defaults: {
        timeout: 30000,
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    client = new EchoClient({
      baseUrl: TEST_SERVER_URL,
      apiKey: TEST_API_KEY,
    });
  });

  describe('Authentication', () => {
    it('should include Authorization header in requests', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { totalCredits: 100, totalSpent: 0, balance: 100 },
      });

      await client.getBalance();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/balance', {
        params: {},
      });
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Authentication failed') as ErrorWithResponse;
      error.response = { status: 401 };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getBalance()).rejects.toThrow();
    });
  });

  describe('getBalance', () => {
    it('should fetch balance successfully', async () => {
      const mockBalance = {
        balance: 75.5,
        totalCredits: 100.0,
        totalSpent: 24.5,
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockBalance });

      const balance = await client.getBalance();

      expect(balance).toEqual(mockBalance);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/balance', {
        params: {},
      });
    });

    it('should fetch balance for specific app', async () => {
      const mockAppId = 'test-app-123';
      const mockBalance = {
        balance: 50.0,
        totalCredits: 75.0,
        totalSpent: 25.0,
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockBalance });

      const balance = await client.getBalance(mockAppId);

      expect(balance).toEqual(mockBalance);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/balance', {
        params: { echoAppId: mockAppId },
      });
    });

    it('should handle balance fetch errors', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getBalance()).rejects.toThrow(
        'Failed to fetch balance'
      );
    });
  });

  describe('createPaymentLink', () => {
    it('should create payment link successfully', async () => {
      const paymentRequest = {
        amount: 50.0,
        description: 'Test payment',
        echoAppId: 'test-app-123',
      };

      const mockResponse = {
        paymentLink: {
          id: 'link_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
          amount: 50.0,
          currency: 'usd',
          description: 'Test payment',
        },
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const response = await client.createPaymentLink(paymentRequest);

      expect(response).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/stripe/payment-link',
        paymentRequest
      );
    });

    it('should create payment link without description', async () => {
      const paymentRequest = {
        amount: 25.0,
      };

      const mockResponse = {
        paymentLink: {
          id: 'link_456',
          url: 'https://checkout.stripe.com/pay/cs_test_456',
          amount: 25.0,
          currency: 'usd',
        },
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const response = await client.createPaymentLink(paymentRequest);

      expect(response).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/stripe/payment-link',
        paymentRequest
      );
    });

    it('should handle payment creation errors', async () => {
      const paymentRequest = {
        amount: -10.0,
        description: 'Invalid amount',
      };

      const error = new Error('Invalid amount');
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.createPaymentLink(paymentRequest)).rejects.toThrow(
        'Failed to create payment link'
      );
    });
  });

  describe('getPaymentUrl', () => {
    it('should generate payment URL', async () => {
      const amount = 100.0;
      const echoAppId = 'test-app-123';
      const description = 'Test payment URL';

      const mockResponse = {
        paymentLink: {
          id: 'link_789',
          url: 'https://checkout.stripe.com/pay/cs_test_789',
          amount: 100.0,
          currency: 'usd',
          description: 'Test payment URL',
        },
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const url = await client.getPaymentUrl(amount, echoAppId, description);

      expect(url).toBe(mockResponse.paymentLink.url);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/stripe/payment-link',
        {
          amount,
          echoAppId,
          description,
        }
      );
    });

    it('should generate payment URL without description', async () => {
      const amount = 50.0;
      const echoAppId = 'test-app-456';

      const mockResponse = {
        paymentLink: {
          id: 'link_012',
          url: 'https://checkout.stripe.com/pay/cs_test_012',
          amount: 50.0,
          currency: 'usd',
          description: 'Echo Credits',
        },
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const url = await client.getPaymentUrl(amount, echoAppId);

      expect(url).toBe(mockResponse.paymentLink.url);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/stripe/payment-link',
        {
          amount,
          echoAppId,
          description: 'Echo Credits',
        }
      );
    });
  });

  describe('listEchoApps', () => {
    it('should list Echo apps successfully', async () => {
      const mockApps = [
        {
          id: 'app1',
          name: 'Test App 1',
          isActive: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          userId: 'user1',
        },
        {
          id: 'app2',
          name: 'Test App 2',
          isActive: false,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
          userId: 'user1',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: { echoApps: mockApps } });

      const apps = await client.listEchoApps();

      expect(apps).toEqual(mockApps);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/echo-apps');
    });

    it('should handle empty app list', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { echoApps: [] } });

      const apps = await client.listEchoApps();

      expect(apps).toEqual([]);
      expect(Array.isArray(apps)).toBe(true);
    });
  });

  describe('getEchoApp', () => {
    it('should fetch specific Echo app', async () => {
      const mockApp = {
        id: 'app1',
        name: 'Test App',
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        userId: 'user1',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: { echoApp: mockApp } });

      const app = await client.getEchoApp('app1');

      expect(app).toEqual(mockApp);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/echo-apps/app1');
    });

    it('should handle non-existent app', async () => {
      const error = new Error('App not found') as ErrorWithResponse;
      error.response = { status: 404 };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getEchoApp('non-existent-app-123')).rejects.toThrow(
        'Failed to fetch Echo app'
      );
    });
  });

  describe('getAppUrl', () => {
    it('should generate correct app URL', () => {
      const appId = 'test-app-123';
      const url = client.getAppUrl(appId);

      expect(url).toBe(`${TEST_SERVER_URL}/apps/${appId}`);
    });

    it('should handle special characters in app ID', () => {
      const appId = 'test-app-with-special-chars_123';
      const url = client.getAppUrl(appId);

      expect(url).toBe(`${TEST_SERVER_URL}/apps/${appId}`);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const error = new Error('Network Error') as ErrorWithResponse;
      error.code = 'ECONNREFUSED';
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getBalance()).rejects.toThrow(
        'Failed to fetch balance'
      );
    });

    it('should handle 401 unauthorized errors', async () => {
      const error = new Error('Unauthorized') as ErrorWithResponse;
      error.response = { status: 401 };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getBalance()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const error = new Error('Timeout') as ErrorWithResponse;
      error.code = 'ECONNABORTED';
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getBalance()).rejects.toThrow(
        'Failed to fetch balance'
      );
    });

    it('should handle API error responses', async () => {
      const error = new Error('API Error') as ErrorWithResponse;
      error.response = {
        status: 400,
        data: {
          error: 'Invalid request parameters',
        },
      };
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.getBalance()).rejects.toThrow(
        'Failed to fetch balance: Invalid request parameters'
      );
    });
  });
});
