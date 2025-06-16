import {
  EchoProvider,
  EchoSignIn,
  EchoTokenPurchase,
  useEcho,
} from '@echo-systems/react-sdk';
import React, { useState, useEffect, useCallback } from 'react';

// Configuration constants
const CONFIG = {
  ECHO_CONTROL_URL: 'http://localhost:3001',
  DEFAULT_CLIENT_ID: 'demo-echo-instance-id',
  REDIRECT_URI: window.location.origin,
  SCOPE: 'llm:invoke offline_access',
} as const;

function Dashboard() {
  const { isAuthenticated, user, balance, error, isLoading } = useEcho();

  // Show loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
        }}
      >
        <h1>Processing authentication...</h1>
        <div>Please wait while we complete the OAuth flow.</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
        }}
      >
        <h1>❌ Authentication Error</h1>
        <p style={{ color: 'red', textAlign: 'center', maxWidth: '500px' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Not signed in - show sign in button
  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
        }}
      >
        <h1>Welcome to Echo Example</h1>
        <EchoSignIn />
      </div>
    );
  }

  // Signed in but no balance - show token purchase
  if (balance?.credits === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
        }}
      >
        <h1>Hi {user?.name}!</h1>
        <p>You need tokens to get started.</p>
        <EchoTokenPurchase amount={100} />
      </div>
    );
  }

  // Signed in - show success and JWT test (regardless of balance)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '20px',
        padding: '20px',
      }}
    >
      <h1>🎉 OAuth Success!</h1>
      <div style={{ textAlign: 'center' }}>
        <p>
          <strong>Welcome {user?.name}!</strong>
        </p>
        <p>Email: {user?.email}</p>
        {balance && (
          <p>
            Balance: {balance?.credits} {balance?.currency}
          </p>
        )}
      </div>
      <JWTTestComponent />
      {balance?.credits === 0 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p>Need tokens to get started?</p>
          <EchoTokenPurchase amount={100} />
        </div>
      )}
    </div>
  );
}

function JWTTestComponent() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const testJWTToken = useCallback(async () => {
    setIsTestLoading(true);
    setTestResult(null);

    try {
      // Get current user and access token from oidc-client-ts
      const userManager = (window as Window).__echoUserManager;
      if (!userManager) {
        throw new Error('UserManager not available');
      }

      const user = await userManager.getUser();
      if (!user?.access_token) {
        throw new Error('No access token available');
      }

      // Test JWT validation endpoint
      const response = await fetch(
        `${CONFIG.ECHO_CONTROL_URL}/api/validate-jwt-token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `JWT validation failed: ${result.error || response.statusText}`
        );
      }

      setTestResult(
        `✅ JWT Token Valid!\n• User ID: ${result.userId}\n• App ID: ${result.appId}\n• Scope: ${result.scope}\n• Valid: ${result.valid}`
      );
    } catch (error) {
      setTestResult(
        `❌ JWT Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsTestLoading(false);
    }
  }, []);

  // Auto-run JWT test on component mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      testJWTToken();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [testJWTToken]);

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: testResult?.includes('✅')
          ? '#e8f5e8'
          : testResult?.includes('❌')
            ? '#f8e8e8'
            : '#f9f9f9',
      }}
    >
      <h3>🔐 JWT Token Validation</h3>
      <button
        onClick={testJWTToken}
        disabled={isTestLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007cba',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isTestLoading ? 'not-allowed' : 'pointer',
          opacity: isTestLoading ? 0.6 : 1,
        }}
      >
        {isTestLoading ? 'Testing...' : 'Re-test JWT Token'}
      </button>
      {testResult && (
        <pre
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
          }}
        >
          {testResult}
        </pre>
      )}
    </div>
  );
}

function ConfigForm({ onSubmit }: { onSubmit: (clientId: string) => void }) {
  const [clientId, setClientId] = useState<string>(CONFIG.DEFAULT_CLIENT_ID);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId.trim()) {
      onSubmit(clientId.trim());
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '20px',
        padding: '20px',
      }}
    >
      <h1>Echo OAuth PKCE Test</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          minWidth: '300px',
        }}
      >
        <div>
          <label
            htmlFor="clientId"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Echo App ID (Client ID):
          </label>
          <input
            id="clientId"
            type="text"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="your-echo-app-id"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
            }}
            required
          />
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          <p>
            <strong>Current Configuration:</strong>
          </p>
          <p>• Echo Control URL: {CONFIG.ECHO_CONTROL_URL}</p>
          <p>• Redirect URI: {CONFIG.REDIRECT_URI}</p>
          <p>• Scope: {CONFIG.SCOPE}</p>
        </div>
        <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
          <p>
            ⚠️ Make sure this redirect URI is configured in your Echo app's
            OAuth settings!
          </p>
        </div>
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            backgroundColor: '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Start OAuth Flow
        </button>
      </form>
    </div>
  );
}

function App() {
  const [clientId, setClientId] = useState<string | null>(() => {
    // Restore client ID from localStorage on app start
    try {
      return localStorage.getItem('echo_oauth_client_id') || null;
    } catch {
      return null;
    }
  });

  const [echoConfig, setEchoConfig] = useState<{
    instanceId: string;
    apiUrl: string;
    redirectUri: string;
    scope: string;
  } | null>(() => {
    // Restore config from localStorage on app start
    try {
      const stored = localStorage.getItem('echo_oauth_config');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleConfigSubmit = (submittedClientId: string) => {
    setClientId(submittedClientId);
    const config = {
      instanceId: submittedClientId,
      apiUrl: CONFIG.ECHO_CONTROL_URL,
      redirectUri: CONFIG.REDIRECT_URI,
      scope: CONFIG.SCOPE,
    };
    setEchoConfig(config);

    // Persist to localStorage
    try {
      localStorage.setItem('echo_oauth_client_id', submittedClientId);
      localStorage.setItem('echo_oauth_config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  };

  const handleReset = () => {
    setClientId(null);
    setEchoConfig(null);
    try {
      localStorage.removeItem('echo_oauth_client_id');
      localStorage.removeItem('echo_oauth_config');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  };

  // Show config form if no client ID is set
  if (!clientId || !echoConfig) {
    return <ConfigForm onSubmit={handleConfigSubmit} />;
  }

  return (
    <EchoProvider config={echoConfig}>
      <div>
        <Dashboard />
        <div style={{ position: 'fixed', top: '10px', right: '10px' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Reset Config
          </button>
        </div>
      </div>
    </EchoProvider>
  );
}

export default App;

// Store UserManager globally for JWT testing
declare global {
  interface Window {
    __echoUserManager?: {
      getUser: () => Promise<{ access_token?: string } | null>;
    };
  }
}
