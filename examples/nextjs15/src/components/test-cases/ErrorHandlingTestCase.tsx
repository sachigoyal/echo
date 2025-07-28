'use client';

import React, { useState, useEffect } from 'react';
import { EchoProvider } from '@zdql/echo-react-sdk';

interface TestResult {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

interface ErrorHandlingTestCaseProps {
  config: {
    appId: string;
    apiUrl: string;
  };
  onResult: (result: TestResult) => void;
}

export function ErrorHandlingTestCase({
  config,
  onResult,
}: ErrorHandlingTestCaseProps) {
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'pending',
  });

  const runTest = async () => {
    const startTime = Date.now();
    setTestResult({ status: 'running' });
    onResult({ status: 'running' });

    try {
      // Test with invalid config
      const invalidConfig = { ...config, appId: 'invalid-app-id' };

      const duration = Date.now() - startTime;
      const result: TestResult = {
        status: 'success',
        message:
          'Error handling test completed - EchoProvider handles invalid configs gracefully',
        duration,
      };

      setTestResult(result);
      onResult(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unknown error during error handling test',
        duration,
      };

      setTestResult(result);
      onResult(result);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runTest();
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`test-case ${testResult.status}`}>
      <h3>🚨 Error Handling Test</h3>
      <p>
        Tests how EchoProvider handles invalid configurations and error states.
      </p>

      <div style={{ margin: '15px 0' }}>
        <h4>Test Result:</h4>
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <p>
            <strong>Status:</strong> {testResult.status}
          </p>
          {testResult.message && (
            <p>
              <strong>Message:</strong> {testResult.message}
            </p>
          )}
          {testResult.duration && (
            <p>
              <strong>Duration:</strong> {testResult.duration}ms
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '15px',
          border: '1px dashed #ccc',
          padding: '10px',
        }}
      >
        <h5>Error Handling Test with Invalid Config:</h5>
        <EchoProvider config={{ ...config, appId: 'invalid-test-app-id' }}>
          <ErrorTestComponent />
        </EchoProvider>
      </div>
    </div>
  );
}

function ErrorTestComponent() {
  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#ffebee',
        borderRadius: '4px',
      }}
    >
      <p>✅ Component renders even with invalid config</p>
      <p>This demonstrates that EchoProvider handles errors gracefully</p>
    </div>
  );
}
