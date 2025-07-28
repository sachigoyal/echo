'use client';

import React, { useState, useEffect } from 'react';
import { EchoProvider } from '@zdql/echo-react-sdk';
import type { EchoConfig } from '@zdql/echo-react-sdk';

interface TestResult {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

interface ConfigurationTestCaseProps {
  config: EchoConfig;
  onResult: (result: TestResult) => void;
}

export function ConfigurationTestCase({
  config,
  onResult,
}: ConfigurationTestCaseProps) {
  const [testResult, setTestResult] = useState<TestResult>({
    status: 'pending',
  });

  const runTest = async () => {
    const startTime = Date.now();
    setTestResult({ status: 'running' });
    onResult({ status: 'running' });

    try {
      // Test configuration validation
      const hasRequiredFields = !!(config.appId && config.apiUrl);

      const duration = Date.now() - startTime;
      const result: TestResult = {
        status: hasRequiredFields ? 'success' : 'error',
        message: hasRequiredFields
          ? 'Configuration validation passed - all required fields present'
          : 'Configuration validation failed - missing required fields',
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
            : 'Unknown error during configuration test',
        duration,
      };

      setTestResult(result);
      onResult(result);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runTest();
    }, 1300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`test-case ${testResult.status}`}>
      <h3>⚙️ Configuration Validation Test</h3>
      <p>Tests EchoProvider configuration validation and setup.</p>

      <div style={{ margin: '15px 0' }}>
        <h4>Input Configuration:</h4>
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          <p>
            <strong>appId:</strong> {config.appId || 'undefined'}
          </p>
          <p>
            <strong>apiUrl:</strong> {config.apiUrl || 'undefined'}
          </p>
          <p>
            <strong>redirectUri:</strong> {config.redirectUri || 'undefined'}
          </p>
          <p>
            <strong>scope:</strong> {config.scope || 'undefined'}
          </p>
        </div>
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
        </div>
      </div>

      <div
        style={{
          marginTop: '15px',
          border: '1px dashed #ccc',
          padding: '10px',
        }}
      >
        <h5>Configuration Test Instance:</h5>
        <EchoProvider config={config}>
          <ConfigTestComponent />
        </EchoProvider>
      </div>
    </div>
  );
}

function ConfigTestComponent() {
  const [providerInternals, setProviderInternals] = useState<any>(null);

  useEffect(() => {
    // Access the provider's internals by checking what gets set up
    const checkProviderSetup = () => {
      // Check if UserManager was created and what settings it has
      const userManager = (window as any).__echoUserManager;
      if (userManager) {
        setProviderInternals({
          userManagerSettings: {
            client_id: userManager.settings.client_id,
            redirect_uri: userManager.settings.redirect_uri,
            scope: userManager.settings.scope,
            authority: userManager.settings.authority,
            silent_redirect_uri: userManager.settings.silent_redirect_uri,
          },
          actualRedirectUri: userManager.settings.redirect_uri,
          actualScope: userManager.settings.scope,
          computedValues: {
            redirectUri: userManager.settings.redirect_uri,
            fallbackRedirectUri: window.location.origin,
            scope: userManager.settings.scope,
            fallbackScope: 'llm:invoke offline_access',
          },
        });
      }
    };

    // Check immediately and after a short delay to catch async initialization
    checkProviderSetup();
    const timer = setTimeout(checkProviderSetup, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#e8f5e8',
        borderRadius: '4px',
      }}
    >
      <p>✅ EchoProvider initialized with provided configuration</p>

      {providerInternals ? (
        <div style={{ marginTop: '10px', fontSize: '12px' }}>
          <h6>🔍 Provider Internal Values:</h6>
          <div
            style={{
              backgroundColor: '#fff',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'monospace',
            }}
          >
            <p>
              <strong>Actual redirectUri:</strong>{' '}
              {providerInternals.actualRedirectUri}
            </p>
            <p>
              <strong>Actual scope:</strong> {providerInternals.actualScope}
            </p>
            <p>
              <strong>Authority:</strong>{' '}
              {providerInternals.userManagerSettings.authority}
            </p>

            <details style={{ marginTop: '8px' }}>
              <summary>Full UserManager Settings</summary>
              <pre style={{ fontSize: '10px', marginTop: '4px' }}>
                {JSON.stringify(providerInternals.userManagerSettings, null, 2)}
              </pre>
            </details>

            <details style={{ marginTop: '8px' }}>
              <summary>Computed Fallback Logic</summary>
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                <p>
                  redirectUri: {providerInternals.computedValues.redirectUri}
                  {providerInternals.computedValues.redirectUri ===
                  providerInternals.computedValues.fallbackRedirectUri
                    ? ' (using fallback)'
                    : ' (from config)'}
                </p>
                <p>
                  scope: {providerInternals.computedValues.scope}
                  {providerInternals.computedValues.scope ===
                  providerInternals.computedValues.fallbackScope
                    ? ' (using fallback)'
                    : ' (from config)'}
                </p>
              </div>
            </details>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '12px', color: '#666' }}>
          Waiting for provider initialization...
        </p>
      )}
    </div>
  );
}
