import { EchoClient } from '../client';
import { validateApiKey } from '../auth';
import { Balance } from '../types';
import './setup'; // Import setup to start server
import { TEST_SERVER_URL, TEST_API_KEY } from './setup';

describe('Integration Tests', () => {
  let client: EchoClient;

  beforeAll(() => {
    client = new EchoClient({
      baseUrl: TEST_SERVER_URL,
      apiKey: TEST_API_KEY,
    });
  });

  describe('Full SDK Workflow', () => {
    it('should complete a full user workflow', async () => {
      // 1. Validate API key format
      expect(validateApiKey(TEST_API_KEY)).toBe(true);

      // 2. Create client and test connection
      expect(client).toBeInstanceOf(EchoClient);

      // 3. Get initial balance
      const initialBalance = await client.getBalance();
      expect(initialBalance).toHaveProperty('balance');
      expect(initialBalance).toHaveProperty('totalCredits');
      expect(initialBalance).toHaveProperty('totalSpent');
      expect(typeof initialBalance.balance).toBe('number');

      // 4. List apps
      const apps = await client.listEchoApps();
      expect(Array.isArray(apps)).toBe(true);

      // 5. If apps exist, get details of first app
      if (apps.length > 0) {
        const firstApp = await client.getEchoApp(apps[0].id);
        expect(firstApp).toHaveProperty('id');
        expect(firstApp.id).toBe(apps[0].id);

        // 6. Get app URL
        const appUrl = client.getAppUrl(firstApp.id);
        expect(appUrl).toBe(`${TEST_SERVER_URL}/apps/${firstApp.id}`);
      }

      // 7. Create payment link
      const paymentRequest = {
        amount: 10.00,
        description: 'Integration test payment',
      };

      const paymentResponse = await client.createPaymentLink(paymentRequest);
      expect(paymentResponse).toHaveProperty('paymentLink');
      expect(paymentResponse.paymentLink).toHaveProperty('url');
      expect(paymentResponse.paymentLink).toHaveProperty('amount');
      expect(paymentResponse.paymentLink.amount).toBe(paymentRequest.amount);

      // 8. Get payment URL using the convenience method
      if (apps.length > 0) {
        const paymentUrl = await client.getPaymentUrl(
          25.00,
          apps[0].id,
          'Convenience method test'
        );
        expect(paymentUrl).toMatch(/^https?:\/\//);
      }
    });

    it('should handle authentication errors properly', async () => {
      const invalidClient = new EchoClient({
        baseUrl: TEST_SERVER_URL,
        apiKey: 'invalid_key_format',
      });

      await expect(invalidClient.getBalance()).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const networkErrorClient = new EchoClient({
        baseUrl: 'http://localhost:99999', // Non-existent server
        apiKey: TEST_API_KEY,
      });

      await expect(networkErrorClient.getBalance()).rejects.toThrow();
    });
  });

  describe('Real API Responses', () => {
    it('should receive properly formatted balance response', async () => {
      const balance = await client.getBalance();

      // Check that all required fields exist and have correct types
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('totalCredits');
      expect(balance).toHaveProperty('totalSpent');

      expect(typeof balance.balance).toBe('number');
      expect(typeof balance.totalCredits).toBe('number');
      expect(typeof balance.totalSpent).toBe('number');

      // Validate business logic
      expect(balance.balance).toBe(balance.totalCredits - balance.totalSpent);
      expect(balance.totalCredits).toBeGreaterThanOrEqual(0);
      expect(balance.totalSpent).toBeGreaterThanOrEqual(0);
    });

    it('should receive properly formatted apps response', async () => {
      const apps = await client.listEchoApps();

      expect(Array.isArray(apps)).toBe(true);

      apps.forEach(app => {
        // Required fields
        expect(app).toHaveProperty('id');
        expect(app).toHaveProperty('name');
        expect(app).toHaveProperty('isActive');
        expect(app).toHaveProperty('createdAt');
        expect(app).toHaveProperty('updatedAt');
        expect(app).toHaveProperty('userId');

        // Type validations
        expect(typeof app.id).toBe('string');
        expect(typeof app.name).toBe('string');
        expect(typeof app.isActive).toBe('boolean');
        expect(typeof app.createdAt).toBe('string');
        expect(typeof app.updatedAt).toBe('string');
        expect(typeof app.userId).toBe('string');

        // Optional fields type validation
        if (app.description !== undefined) {
          expect(typeof app.description).toBe('string');
        }
        if (app.totalTokens !== undefined) {
          expect(typeof app.totalTokens).toBe('number');
          expect(app.totalTokens).toBeGreaterThanOrEqual(0);
        }
        if (app.totalCost !== undefined) {
          expect(typeof app.totalCost).toBe('number');
          expect(app.totalCost).toBeGreaterThanOrEqual(0);
        }

        // Date validations
        expect(new Date(app.createdAt)).toBeInstanceOf(Date);
        expect(new Date(app.updatedAt)).toBeInstanceOf(Date);
        expect(new Date(app.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(app.createdAt).getTime()
        );
      });
    });

    it('should receive properly formatted payment link response', async () => {
      const paymentRequest = {
        amount: 15.50,
        description: 'Test payment link validation',
      };

      const response = await client.createPaymentLink(paymentRequest);

      expect(response).toHaveProperty('paymentLink');
      const { paymentLink } = response;

      // Required fields
      expect(paymentLink).toHaveProperty('id');
      expect(paymentLink).toHaveProperty('url');
      expect(paymentLink).toHaveProperty('amount');
      expect(paymentLink).toHaveProperty('currency');

      // Type validations
      expect(typeof paymentLink.id).toBe('string');
      expect(typeof paymentLink.url).toBe('string');
      expect(typeof paymentLink.amount).toBe('number');
      expect(typeof paymentLink.currency).toBe('string');

      // Value validations
      expect(paymentLink.amount).toBe(paymentRequest.amount);
      expect(paymentLink.url).toMatch(/^https?:\/\//);
      expect(paymentLink.currency.toLowerCase()).toBe('usd');

      if (paymentLink.description !== undefined) {
        expect(typeof paymentLink.description).toBe('string');
      }
    });
  });

  describe('Error Scenarios', () => {
    it('should handle non-existent app requests', async () => {
      await expect(
        client.getEchoApp('non-existent-app-id-12345')
      ).rejects.toThrow();
    });

    it('should handle invalid payment amounts', async () => {
      await expect(
        client.createPaymentLink({ amount: -1 })
      ).rejects.toThrow();

      await expect(
        client.createPaymentLink({ amount: 0 })
      ).rejects.toThrow();
    });

    it('should handle timeout scenarios', async () => {
      const timeoutClient = new EchoClient({
        baseUrl: TEST_SERVER_URL,
        apiKey: TEST_API_KEY,
      });

      // Set a very short timeout
      timeoutClient['http'].defaults.timeout = 1;

      await expect(timeoutClient.getBalance()).rejects.toThrow();
    }, 10000);
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 5 }, () => client.getBalance());

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should succeed
      expect(results).toHaveLength(5);
      results.forEach(balance => {
        expect(balance).toHaveProperty('balance');
        expect(balance).toHaveProperty('totalCredits');
        expect(balance).toHaveProperty('totalSpent');
      });

      // Should complete within reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });

    it('should handle rapid sequential requests', async () => {
      const results: Balance[] = [];
      
      for (let i = 0; i < 3; i++) {
        const balance = await client.getBalance();
        results.push(balance);
      }

      expect(results).toHaveLength(3);
      results.forEach(balance => {
        expect(balance).toHaveProperty('balance');
      });
    });
  });
}); 