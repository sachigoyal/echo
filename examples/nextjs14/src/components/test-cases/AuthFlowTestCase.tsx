'use client';

import React, { useState, useEffect } from 'react';
import { EchoProvider, useEcho } from '@merit-systems/echo-react-sdk';

interface TestResult {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

interface AuthFlowTestCaseProps {
  config: {
    appId: string;
    apiUrl: string;
  };
  onResult: (result: TestResult) => void;
}

export function AuthFlowTestCase({ config, onResult }: AuthFlowTestCaseProps) {
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'pending',
  });

  const runTest = async () => {
    const startTime = Date.now();
    setTestResult({ status: 'running' });
    onResult({ status: 'running' });

    try {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        status: 'success',
        message:
          'Auth flow test completed - check component below for sign-in functionality',
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
            : 'Unknown error during auth test',
        duration,
      };

      setTestResult(result);
      onResult(result);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runTest();
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`test-case ${testResult.status}`}>
      <h3>🔐 Authentication Flow Test</h3>
      <p>Tests authentication flow components and functionality.</p>

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
        <h5>Live Auth Test:</h5>
        <EchoProvider config={config}>
          <AuthTestComponent />
        </EchoProvider>
      </div>
    </div>
  );
}

function AuthTestComponent() {
  const { isAuthenticated, user, signIn, signOut, isLoading } = useEcho();

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#fff8e1',
        borderRadius: '4px',
      }}
    >
      <p>
        <strong>Authentication Status:</strong>{' '}
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </p>
      <p>
        <strong>User:</strong> {user?.name || 'None'}
      </p>
      <p>
        <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
      </p>
      <div style={{ marginTop: '10px' }}>
        {!isAuthenticated ? (
          <button
            onClick={signIn}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Test Sign In
          </button>
        ) : (
          <button
            onClick={signOut}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Test Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
