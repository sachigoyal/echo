import { spawn } from 'child_process';
import path from 'path';
import { EchoClient } from '../client';
import { storeApiKey, getStoredApiKey, removeStoredApiKey } from '../auth';
import { TEST_SERVER_URL, TEST_API_KEY } from './setup';

// Mock dependencies
jest.mock('../client');
jest.mock('../auth');
jest.mock('inquirer');
jest.mock('open');

const MockedEchoClient = EchoClient as jest.MockedClass<typeof EchoClient>;
const mockedStoreApiKey = storeApiKey as jest.MockedFunction<typeof storeApiKey>;
const mockedGetStoredApiKey = getStoredApiKey as jest.MockedFunction<typeof getStoredApiKey>;
const mockedRemoveStoredApiKey = removeStoredApiKey as jest.MockedFunction<typeof removeStoredApiKey>;

// Helper function to execute CLI commands
async function executeCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const cliPath = path.join(__dirname, '../cli.ts');
    const child = spawn('npx', ['ts-node', cliPath, ...args], {
      env: {
        ...process.env,
        ECHO_BASE_URL: TEST_SERVER_URL,
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });
  });
}

describe('CLI Commands', () => {
  let mockClient: jest.Mocked<EchoClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock client
    mockClient = {
      getBalance: jest.fn(),
      listEchoApps: jest.fn(),
      createPaymentLink: jest.fn(),
      getEchoApp: jest.fn(),
      getPaymentUrl: jest.fn(),
      getAppUrl: jest.fn(),
    } as any;

    MockedEchoClient.mockImplementation(() => mockClient);
  });

  describe('login command', () => {
    it('should handle successful authentication', async () => {
      const inquirer = require('inquirer');
      const open = require('open');
      
      inquirer.prompt.mockResolvedValue({ apiKey: TEST_API_KEY });
      open.mockResolvedValue(undefined);
      mockedStoreApiKey.mockResolvedValue(undefined);
      mockClient.listEchoApps.mockResolvedValue([
        {
          id: 'app1',
          name: 'Test App',
          isActive: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          userId: 'user1',
        }
      ]);

      const result = await executeCLI(['login']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Authentication complete');
    });

    it('should handle authentication failure', async () => {
      const inquirer = require('inquirer');
      const open = require('open');
      
      inquirer.prompt.mockResolvedValue({ apiKey: 'invalid_key' });
      open.mockResolvedValue(undefined);

      const result = await executeCLI(['login']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('API key verification failed');
    });

    it('should validate API key format during login', async () => {
      const inquirer = require('inquirer');
      
      // Simulate invalid API key input
      inquirer.prompt.mockImplementation(async (questions: any) => {
        const question = questions[0];
        const validationResult = question.validate('invalid_key_format');
        expect(validationResult).toContain('Invalid API key format');
        
        return { apiKey: TEST_API_KEY };
      });

      const open = require('open');
      open.mockResolvedValue(undefined);
      mockedStoreApiKey.mockResolvedValue(undefined);
      mockClient.listEchoApps.mockResolvedValue([]);
    });
  });

  describe('logout command', () => {
    it('should successfully logout', async () => {
      mockedRemoveStoredApiKey.mockResolvedValue(undefined);

      const result = await executeCLI(['logout']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Successfully logged out');
      expect(mockedRemoveStoredApiKey).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      mockedRemoveStoredApiKey.mockRejectedValue(new Error('Keychain error'));

      const result = await executeCLI(['logout']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Logout failed');
    });
  });

  describe('apps command', () => {
    beforeEach(() => {
      mockedGetStoredApiKey.mockResolvedValue(TEST_API_KEY);
    });

    it('should list apps successfully', async () => {
      const mockApps = [
        {
          id: 'app1',
          name: 'Test App 1',
          description: 'First test app',
          isActive: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          userId: 'user1',
          totalTokens: 1000,
          totalCost: 0.05,
        },
        {
          id: 'app2',
          name: 'Test App 2',
          isActive: false,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
          userId: 'user1',
          totalTokens: 500,
          totalCost: 0.02,
        },
      ];

      mockClient.listEchoApps.mockResolvedValue(mockApps);

      const result = await executeCLI(['apps']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Found 2 Echo app(s)');
      expect(result.stdout).toContain('Test App 1');
      expect(result.stdout).toContain('Test App 2');
      expect(result.stdout).toContain('Active');
      expect(result.stdout).toContain('Inactive');
      expect(result.stdout).toContain('1,000'); // Token count formatting
      expect(result.stdout).toContain('$0.0500'); // Cost formatting
    });

    it('should handle empty app list', async () => {
      mockClient.listEchoApps.mockResolvedValue([]);

      const result = await executeCLI(['apps']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No Echo apps found');
    });

    it('should handle API errors', async () => {
      mockClient.listEchoApps.mockRejectedValue(new Error('API Error'));

      const result = await executeCLI(['apps']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to fetch Echo apps');
    });

    it('should work with ls alias', async () => {
      mockClient.listEchoApps.mockResolvedValue([]);

      const result = await executeCLI(['ls']);

      expect(result.exitCode).toBe(0);
      expect(mockClient.listEchoApps).toHaveBeenCalled();
    });
  });

  describe('balance command', () => {
    beforeEach(() => {
      mockedGetStoredApiKey.mockResolvedValue(TEST_API_KEY);
    });

    it('should display balance successfully', async () => {
      const mockBalance = {
        balance: 75.50,
        totalCredits: 100.00,
        totalSpent: 24.50,
      };

      mockClient.getBalance.mockResolvedValue(mockBalance);

      const result = await executeCLI(['balance']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Balance: $75.50');
      expect(result.stdout).toContain('Total Credits: $100.00');
      expect(result.stdout).toContain('Total Spent: $24.50');
    });

    it('should handle balance API errors', async () => {
      mockClient.getBalance.mockRejectedValue(new Error('Network error'));

      const result = await executeCLI(['balance']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to fetch balance');
    });

    it('should handle zero balance', async () => {
      const mockBalance = {
        balance: 0.00,
        totalCredits: 50.00,
        totalSpent: 50.00,
      };

      mockClient.getBalance.mockResolvedValue(mockBalance);

      const result = await executeCLI(['balance']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Balance: $0.00');
    });
  });

  describe('payment command', () => {
    beforeEach(() => {
      mockedGetStoredApiKey.mockResolvedValue(TEST_API_KEY);
    });

    it('should generate payment link with amount option', async () => {
      const mockResponse = {
        paymentLink: {
          id: 'link_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
          amount: 50.00,
          currency: 'usd',
          description: 'Echo credits',
        },
      };

      mockClient.createPaymentLink.mockResolvedValue(mockResponse);

      const result = await executeCLI(['payment', '--amount', '50']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Payment link generated successfully');
      expect(result.stdout).toContain('https://checkout.stripe.com/pay/cs_test_123');
      expect(result.stdout).toContain('$50.00');
      expect(mockClient.createPaymentLink).toHaveBeenCalledWith({
        amount: 50,
        description: undefined,
      });
    });

    it('should generate payment link with description', async () => {
      const mockResponse = {
        paymentLink: {
          id: 'link_456',
          url: 'https://checkout.stripe.com/pay/cs_test_456',
          amount: 25.00,
          currency: 'usd',
          description: 'Custom payment',
        },
      };

      mockClient.createPaymentLink.mockResolvedValue(mockResponse);

      const result = await executeCLI(['payment', '--amount', '25', '--description', 'Custom payment']);

      expect(result.exitCode).toBe(0);
      expect(mockClient.createPaymentLink).toHaveBeenCalledWith({
        amount: 25,
        description: 'Custom payment',
      });
    });

    it('should handle interactive payment amount input', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({
        amount: 75,
        description: 'Interactive payment',
      });

      const mockResponse = {
        paymentLink: {
          id: 'link_789',
          url: 'https://checkout.stripe.com/pay/cs_test_789',
          amount: 75.00,
          currency: 'usd',
          description: 'Interactive payment',
        },
      };

      mockClient.createPaymentLink.mockResolvedValue(mockResponse);

      const result = await executeCLI(['payment']);

      expect(result.exitCode).toBe(0);
      expect(mockClient.createPaymentLink).toHaveBeenCalledWith({
        amount: 75,
        description: 'Interactive payment',
      });
    });

    it('should handle payment link creation errors', async () => {
      mockClient.createPaymentLink.mockRejectedValue(new Error('Payment service unavailable'));

      const result = await executeCLI(['payment', '--amount', '100']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to generate payment link');
    });
  });

  describe('Authentication required commands', () => {
    it('should require authentication for apps command', async () => {
      mockedGetStoredApiKey.mockResolvedValue(null);

      const result = await executeCLI(['apps']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No valid authentication found');
    });

    it('should require authentication for balance command', async () => {
      mockedGetStoredApiKey.mockResolvedValue(null);

      const result = await executeCLI(['balance']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No valid authentication found');
    });

    it('should require authentication for payment command', async () => {
      mockedGetStoredApiKey.mockResolvedValue(null);

      const result = await executeCLI(['payment']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No valid authentication found');
    });
  });

  describe('Help and version', () => {
    it('should display help information', async () => {
      const result = await executeCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('CLI tool for managing Echo applications');
      expect(result.stdout).toContain('login');
      expect(result.stdout).toContain('logout');
      expect(result.stdout).toContain('apps');
      expect(result.stdout).toContain('balance');
      expect(result.stdout).toContain('payment');
    });

    it('should display version information', async () => {
      const result = await executeCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid commands gracefully', async () => {
      const result = await executeCLI(['invalid-command']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('error: unknown command');
    });

    it('should handle SDK client initialization errors', async () => {
      MockedEchoClient.mockImplementation(() => {
        throw new Error('Client initialization failed');
      });

      mockedGetStoredApiKey.mockResolvedValue(TEST_API_KEY);

      const result = await executeCLI(['apps']);

      expect(result.exitCode).toBe(1);
    });
  });
}); 