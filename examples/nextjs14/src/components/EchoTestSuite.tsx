'use client';

import React, { useState, useEffect } from 'react';
import { EchoProvider } from '@merit-systems/echo-react-sdk';
import { SSRTestCase } from './test-cases/SSRTestCase';
import { CSRTestCase } from './test-cases/CSRTestCase';
import { AuthFlowTestCase } from './test-cases/AuthFlowTestCase';
import { ErrorHandlingTestCase } from './test-cases/ErrorHandlingTestCase';
import { ConfigurationTestCase } from './test-cases/ConfigurationTestCase';

// Test configuration - matches the create-echo-app template
const TEST_CONFIG = {
  appId:
    process.env.NEXT_PUBLIC_ECHO_APP_ID ||
    '39054694-0960-4612-9741-05fd6175f4f9',
  apiUrl: process.env.NEXT_PUBLIC_ECHO_API_URL || 'http://localhost:3000',
};

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export function EchoTestSuite() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'SSR Compatibility', status: 'pending' },
    { name: 'CSR Functionality', status: 'pending' },
    { name: 'Authentication Flow', status: 'pending' },
    { name: 'Error Handling', status: 'pending' },
    { name: 'Configuration Validation', status: 'pending' },
  ]);

  const [isTestingMode, setIsTestingMode] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const updateTestResult = (name: string, result: Partial<TestResult>) => {
    setTestResults(prev =>
      prev.map(test => (test.name === name ? { ...test, ...result } : test))
    );
  };

  const runAllTests = async () => {
    setIsTestingMode(true);
    setCurrentTest('Running all tests...');

    for (const test of testResults) {
      setCurrentTest(test.name);
      updateTestResult(test.name, { status: 'running' });

      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock test results - in real implementation, these would be actual test results
      const success = Math.random() > 0.2; // 80% success rate for demo
      updateTestResult(test.name, {
        status: success ? 'success' : 'error',
        message: success
          ? 'Test passed'
          : 'Test failed - see console for details',
        duration: Math.floor(Math.random() * 2000) + 500,
      });
    }

    setCurrentTest(null);
    setIsTestingMode(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h2>EchoProvider Test Cases</h2>
        <p>
          Testing EchoProvider rendering and functionality in NextJS environment
        </p>
        <div style={{ margin: '20px 0' }}>
          <button
            onClick={runAllTests}
            disabled={isTestingMode}
            style={{
              padding: '10px 20px',
              backgroundColor: isTestingMode ? '#ccc' : '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isTestingMode ? 'not-allowed' : 'pointer',
            }}
          >
            {isTestingMode ? 'Running Tests...' : 'Run All Tests'}
          </button>
          {currentTest && (
            <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
              Currently testing: {currentTest}
            </p>
          )}
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="test-case">
        <h3>Test Results Summary</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor:
                  result.status === 'success'
                    ? '#e8f5e8'
                    : result.status === 'error'
                      ? '#ffe8e8'
                      : result.status === 'running'
                        ? '#e8f0ff'
                        : '#f5f5f5',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            >
              <span>{result.name}</span>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span
                  style={{
                    color:
                      result.status === 'success'
                        ? '#4caf50'
                        : result.status === 'error'
                          ? '#f44336'
                          : result.status === 'running'
                            ? '#2196f3'
                            : '#666',
                  }}
                >
                  {result.status === 'running'
                    ? '⏳'
                    : result.status === 'success'
                      ? '✅'
                      : result.status === 'error'
                        ? '❌'
                        : '⏸️'}{' '}
                  {result.status}
                </span>
                {result.duration && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    ({result.duration}ms)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Test Cases */}
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <SSRTestCase
          config={TEST_CONFIG}
          onResult={result => updateTestResult('SSR Compatibility', result)}
        />

        <CSRTestCase
          config={TEST_CONFIG}
          onResult={result => updateTestResult('CSR Functionality', result)}
        />

        <AuthFlowTestCase
          config={TEST_CONFIG}
          onResult={result => updateTestResult('Authentication Flow', result)}
        />

        <ErrorHandlingTestCase
          config={TEST_CONFIG}
          onResult={result => updateTestResult('Error Handling', result)}
        />

        <ConfigurationTestCase
          config={TEST_CONFIG}
          onResult={result =>
            updateTestResult('Configuration Validation', result)
          }
        />
      </div>

      {/* Live EchoProvider Test */}
      <div className="test-case" style={{ marginTop: '30px' }}>
        <h3>Live EchoProvider Test</h3>
        <p>
          This is a live instance of EchoProvider to test actual functionality:
        </p>
        <div
          style={{
            border: '2px dashed #ddd',
            padding: '20px',
            marginTop: '10px',
          }}
        >
          <EchoProvider config={TEST_CONFIG}>
            <LiveProviderTest />
          </EchoProvider>
        </div>
      </div>
    </div>
  );
}

// Component to test EchoProvider in a live environment
function LiveProviderTest() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Waiting for client-side hydration...</div>;
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p>✅ EchoProvider successfully mounted in NextJS!</p>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
        This component is wrapped by EchoProvider and demonstrates that the
        provider can render without errors in a NextJS environment.
      </p>
    </div>
  );
}
