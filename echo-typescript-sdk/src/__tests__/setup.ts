import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import path from 'path';

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let serverProcess: ChildProcess | null = null;
const SERVER_PORT = process.env.TEST_SERVER_PORT ?? 3001;
const SERVER_BASE_URL = `http://localhost:${SERVER_PORT}`;

// Set environment variables for tests
process.env.ECHO_BASE_URL = SERVER_BASE_URL;

// Global server setup
beforeAll(async () => {
  console.log('Starting Echo server for tests...');

  // Start the echo server in test mode
  const serverPath = path.join(__dirname, '../../../echo-server');

  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: serverPath,
    env: {
      ...process.env,
      PORT: SERVER_PORT.toString(),
      NODE_ENV: 'test',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (serverProcess.stdout) {
    serverProcess.stdout.on('data', data => {
      console.log(`[Server] ${data.toString()}`);
    });
  }

  if (serverProcess.stderr) {
    serverProcess.stderr.on('data', data => {
      console.error(`[Server Error] ${data.toString()}`);
    });
  }

  // Wait for server to start
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 15000);

    const checkServer = async () => {
      try {
        await fetch(`${SERVER_BASE_URL}/account/balance`, {
          headers: {
            Authorization: 'Bearer test-token',
          },
        });
        clearTimeout(timeout);
        resolve(true);
      } catch {
        setTimeout(() => void checkServer(), 500);
      }
    };

    setTimeout(() => void checkServer(), 2000); // Wait 2 seconds before first check
  });

  console.log('Echo server started successfully');
});

// Global server teardown
afterAll(async () => {
  if (serverProcess) {
    console.log('Stopping Echo server...');
    serverProcess.kill('SIGTERM');

    // Wait for process to exit
    await new Promise(resolve => {
      if (serverProcess) {
        serverProcess.on('exit', resolve);
        // Force kill after 5 seconds
        setTimeout(() => {
          if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGKILL');
          }
          resolve(true);
        }, 5000);
      } else {
        resolve(true);
      }
    });

    console.log('Echo server stopped');
  }
});

// Mock keytar for testing authentication
jest.mock('keytar', () => ({
  setPassword: jest.fn().mockResolvedValue(undefined),
  getPassword: jest.fn().mockResolvedValue(null),
  deletePassword: jest.fn().mockResolvedValue(true),
}));

// Mock process.exit to prevent tests from actually exiting
beforeEach(() => {
  jest
    .spyOn(process, 'exit')
    .mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`Process.exit called with code: ${code}`);
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Export utilities for tests
export const TEST_SERVER_URL = SERVER_BASE_URL;
export const TEST_API_KEY = 'echo_test_api_key_12345';
export const INVALID_API_KEY = 'invalid_key';
