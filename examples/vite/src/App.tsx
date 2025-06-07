import {
  EchoProvider,
  EchoSignIn,
  EchoTokenPurchase,
  useEcho,
} from '@echo-systems/react-sdk';
import { useState } from 'react';

// Configuration constants
const CONFIG = {
  ECHO_CONTROL_URL: 'http://localhost:3001',
  DEFAULT_CLIENT_ID: 'demo-echo-instance-id',
  REDIRECT_URI: window.location.origin,
  SCOPE: 'llm:invoke offline_access',
} as const;

function Dashboard() {
  const { isAuthenticated, user, balance, error } = useEcho();

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

  // Signed in with balance - success!
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
      <h1>🎉 Success!</h1>
      <p>Welcome {user?.name}!</p>
      <p>
        You have {balance?.credits} {balance?.currency}
      </p>
      <JWTTestComponent />
    </div>
  );
}

function JWTTestComponent() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const testJWTToken = async () => {
    setIsTestLoading(true);
    setTestResult(null);

    try {
      // Get current user and access token from oidc-client-ts
      const userManager = (window as any).__echoUserManager;
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
  };

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}
    >
      <h3>JWT Token Test</h3>
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
        {isTestLoading ? 'Testing...' : 'Test JWT Token'}
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
        <div style={{ fontSize: '12px', color: '#666' }}>
          <p>
            <strong>Configuration:</strong>
          </p>
          <p>• Echo Control URL: {CONFIG.ECHO_CONTROL_URL}</p>
          <p>• Redirect URI: {CONFIG.REDIRECT_URI}</p>
          <p>• Scope: {CONFIG.SCOPE}</p>
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
  const [clientId, setClientId] = useState<string | null>(null);
  const [echoConfig, setEchoConfig] = useState<any>(null);

  const handleConfigSubmit = (submittedClientId: string) => {
    setClientId(submittedClientId);
    const config = {
      instanceId: submittedClientId,
      apiUrl: CONFIG.ECHO_CONTROL_URL,
      redirectUri: CONFIG.REDIRECT_URI,
      scope: CONFIG.SCOPE,
    };
    setEchoConfig(config);
  };

  // Show config form if no client ID is set
  if (!clientId || !echoConfig) {
    return <ConfigForm onSubmit={handleConfigSubmit} />;
  }

  return (
    <EchoProvider config={echoConfig}>
      <Dashboard />
    </EchoProvider>
  );
}

export default App;

// Store UserManager globally for JWT testing
declare global {
  interface Window {
    __echoUserManager?: any;
  }
}
