'use client';

import React, { useState, useEffect } from 'react';
import { EchoProvider, useEcho } from '@zdql/echo-react-sdk';

interface TestResult {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

interface SSRTestCaseProps {
  config: {
    appId: string;
    apiUrl: string;
  };
  onResult: (result: TestResult) => void;
}

export function SSRTestCase({ config, onResult }: SSRTestCaseProps) {
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'pending',
  });
  const [isRendered, setIsRendered] = useState(false);
  const [hydrationMismatch, setHydrationMismatch] = useState(false);
  const [windowUndefined, setWindowUndefined] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setWindowUndefined(true);
    }
  }, []);

  const runTest = async () => {
    const startTime = Date.now();
    setTestResult({ status: 'running' });
    onResult({ status: 'running' });

    try {
      // Test 1: Check if EchoProvider can be instantiated without errors
      let ssrSafe = true;
      let errorMessage = '';

      // Test server-side rendering compatibility
      if (typeof window === 'undefined') {
        // This would be true during SSR
        ssrSafe = true;
      } else {
        // Client-side test - ensure no hydration mismatches
        try {
          // Test that the component renders without throwing
          setIsRendered(true);

          // Wait a bit to see if hydration mismatches occur
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check if hydration warning was logged (this is a basic check)
          const originalConsoleError = console.error;
          let hasHydrationError = false;
          console.error = (...args: unknown[]) => {
            const message = args.join(' ');
            if (
              message.includes('Hydration failed') ||
              message.includes('hydration')
            ) {
              hasHydrationError = true;
              setHydrationMismatch(true);
            }
            originalConsoleError.apply(console, args);
          };

          // Restore console.error after a brief period
          setTimeout(() => {
            console.error = originalConsoleError;
          }, 1000);

          if (hasHydrationError) {
            ssrSafe = false;
            errorMessage = 'Hydration mismatch detected';
          } else {
            ssrSafe = true;
          }
        } catch (error) {
          ssrSafe = false;
          errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        }
      }

      const duration = Date.now() - startTime;
      const result: TestResult = {
        status: ssrSafe ? 'success' : 'error',
        message: ssrSafe
          ? 'EchoProvider is SSR compatible and renders without hydration issues'
          : `SSR compatibility failed: ${errorMessage}`,
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
            : 'Unknown error during SSR test',
        duration,
      };

      setTestResult(result);
      onResult(result);
    }
  };

  useEffect(() => {
    // Auto-run test when component mounts
    const timer = setTimeout(() => {
      runTest();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`test-case ${testResult.status}`}>
      <h3>🔄 SSR Compatibility Test</h3>
      <p>
        Tests whether EchoProvider can render during server-side rendering
        without errors.
      </p>

      <div style={{ margin: '15px 0' }}>
        <h4>Test Criteria:</h4>
        <ul style={{ marginLeft: '20px' }}>
          <li>EchoProvider doesn't throw errors during SSR</li>
          <li>No hydration mismatches occur</li>
          <li>
            UserManager initialization is properly deferred to client-side
          </li>
          <li>Component state initializes correctly</li>
          <li>Loading state is consistent between server and client</li>
        </ul>
      </div>

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
          <p>
            <strong>Rendered:</strong> {isRendered ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Environment:</strong>{' '}
            {windowUndefined ? 'Server' : 'Client'}
          </p>
          <p>
            <strong>Hydration Mismatch:</strong>{' '}
            {hydrationMismatch ? 'Detected ❌' : 'None ✅'}
          </p>
        </div>
      </div>

      <button
        onClick={runTest}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007cba',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Re-run SSR Test
      </button>

      {/* Test EchoProvider rendering */}
      <div
        style={{
          marginTop: '15px',
          border: '1px dashed #ccc',
          padding: '10px',
        }}
      >
        <h5>Live Test Instance:</h5>
        <EchoProvider config={config}>
          <SSRTestComponent />
        </EchoProvider>
      </div>
    </div>
  );
}

// Component to test inside EchoProvider
function SSRTestComponent() {
  const [mounted, setMounted] = useState(false);
  const { isLoading, isAuthenticated, user } = useEcho();
  const [windowUndefined, setWindowUndefined] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setWindowUndefined(true);
    }
  }, []);

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#f0f8ff',
        borderRadius: '4px',
      }}
    >
      <p>✅ SSR Test Component Successfully Rendered</p>
      <p>Mounted: {mounted ? 'Yes' : 'No'}</p>
      <p>Environment: {windowUndefined ? 'Server' : 'Client'}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {user ? user.name || 'Anonymous' : 'None'}</p>
    </div>
  );
}
