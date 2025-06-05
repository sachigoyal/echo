#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import path from 'path';

/**
 * Test Runner Script
 *
 * This script orchestrates the testing process:
 * 1. Starts the Echo server
 * 2. Waits for it to be ready
 * 3. Runs all tests
 * 4. Cleans up the server
 */

interface TestRunnerOptions {
  testPattern?: string;
  verbose?: boolean;
  coverage?: boolean;
}

class TestRunner {
  private serverProcess: ChildProcess | null = null;
  private readonly serverPort = 3001;
  private readonly serverBaseUrl = `http://localhost:${this.serverPort}`;
  private readonly options: TestRunnerOptions;

  constructor(options: TestRunnerOptions = {}) {
    this.options = options;
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Echo CLI Test Suite...\n');

    try {
      this.startServer();
      await this.waitForServer();
      await this.runTests();
      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    } finally {
      await this.stopServer();
    }
  }

  private startServer(): void {
    console.log('🔄 Starting Echo server for tests...');

    const serverPath = path.join(__dirname, '../../../../echo-server');

    this.serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: serverPath,
      env: {
        ...process.env,
        PORT: this.serverPort.toString(),
        NODE_ENV: 'test',
        TEST_MODE: 'true',
      },
      stdio: this.options.verbose === true ? 'inherit' : 'pipe',
    });

    if (
      (this.options.verbose === undefined || this.options.verbose === false) &&
      this.serverProcess.stdout !== null
    ) {
      this.serverProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('error') || output.includes('Error')) {
          console.log(`[Server] ${output}`);
        }
      });
    }

    if (
      (this.options.verbose === undefined || this.options.verbose === false) &&
      this.serverProcess.stderr !== null
    ) {
      this.serverProcess.stderr.on('data', (data: Buffer) => {
        console.error(`[Server Error] ${data.toString()}`);
      });
    }

    this.serverProcess.on('exit', code => {
      if (code !== null && code !== 0) {
        console.error(`Server process exited with code ${code}`);
      }
    });
  }

  private async waitForServer(): Promise<void> {
    console.log('⏳ Waiting for server to be ready...');

    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.serverBaseUrl}/health`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Echo-CLI-Test-Runner',
          },
        });

        if (response.ok) {
          console.log('✅ Server is ready!');
          return;
        }
      } catch {
        // Server not ready yet, continue waiting
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }

    throw new Error('Server failed to start within timeout period');
  }

  private async runTests(): Promise<void> {
    console.log('\n🧪 Running tests...\n');

    const jestArgs = [
      '--testEnvironment=node',
      '--forceExit',
      '--detectOpenHandles',
    ];

    if (this.options.coverage === true) {
      jestArgs.push('--coverage');
    }

    if (
      this.options.testPattern !== undefined &&
      this.options.testPattern.length > 0
    ) {
      jestArgs.push('--testNamePattern', this.options.testPattern);
    }

    if (this.options.verbose === true) {
      jestArgs.push('--verbose');
    }

    return new Promise((resolve, reject) => {
      const jestProcess = spawn('npx', ['jest', ...jestArgs], {
        cwd: path.join(__dirname, '../..'),
        env: {
          ...process.env,
          ECHO_BASE_URL: this.serverBaseUrl,
          NODE_ENV: 'test',
        },
        stdio: 'inherit',
      });

      jestProcess.on('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      jestProcess.on('error', error => {
        reject(error);
      });
    });
  }

  private async stopServer(): Promise<void> {
    if (this.serverProcess !== null) {
      console.log('\n🛑 Stopping server...');

      this.serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise(resolve => {
        if (this.serverProcess !== null) {
          this.serverProcess.on('exit', resolve);
          // Force kill after 5 seconds
          setTimeout(() => {
            if (this.serverProcess !== null && !this.serverProcess.killed) {
              this.serverProcess.kill('SIGKILL');
            }
            resolve(true);
          }, 5000);
        } else {
          resolve(true);
        }
      });

      console.log('✅ Server stopped');
    }
  }
}

// CLI interface
const main = async () => {
  const args = process.argv.slice(2);
  const options: TestRunnerOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--pattern':
      case '-p': {
        const pattern = args[++i];
        if (pattern !== undefined && pattern.length > 0) {
          options.testPattern = pattern;
        }
        break;
      }
      case '--help':
      case '-h':
        console.log(`
Echo CLI Test Runner

Usage: npm run test:integration [options]

Options:
  --verbose, -v      Show detailed output
  --coverage, -c     Generate coverage report
  --pattern, -p      Run tests matching pattern
  --help, -h         Show this help message

Examples:
  npm run test:integration
  npm run test:integration -- --verbose
  npm run test:integration -- --pattern "auth"
  npm run test:integration -- --coverage
        `);
        return;
    }
  }

  const runner = new TestRunner(options);
  await runner.run();
};

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };
