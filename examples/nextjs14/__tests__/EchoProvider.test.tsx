import { EchoProvider, useEcho } from '@merit-systems/echo-react-sdk';
import { render, screen, waitFor } from '@testing-library/react';

// Test configuration
const testConfig = {
  appId: 'test-app-id',
  apiUrl: 'http://localhost:3000',
  redirectUri: 'http://localhost:3001',
  scope: 'llm:invoke offline_access',
};

// Test component that uses the useEcho hook
function TestComponent() {
  const { isLoading, error, isAuthenticated, user } = useEcho();

  return (
    <div data-testid="test-component">
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user">{user?.name || 'no-user'}</div>
    </div>
  );
}

describe.skip('EchoProvider NextJS Compatibility', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders without crashing in test environment', () => {
    render(
      <EchoProvider config={testConfig}>
        <div>Test content</div>
      </EchoProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('provides context values to child components', async () => {
    render(
      <EchoProvider config={testConfig}>
        <TestComponent />
      </EchoProvider>
    );

    // Wait for component to render and provider to initialize
    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    // Check initial state values
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'not-authenticated'
    );
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  test('handles SSR environment without UserManager', () => {
    // Temporarily remove window to simulate SSR
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    expect(() => {
      render(
        <EchoProvider config={testConfig}>
          <TestComponent />
        </EchoProvider>
      );
    }).not.toThrow();

    // Restore window
    global.window = originalWindow;
  });

  test('initializes with correct config values', () => {
    render(
      <EchoProvider config={testConfig}>
        <TestComponent />
      </EchoProvider>
    );

    // The provider should render without errors with the given config
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  test('handles invalid config gracefully', () => {
    const invalidConfig = {
      appId: '',
      apiUrl: '',
      redirectUri: '',
      scope: '',
    };

    expect(() => {
      render(
        <EchoProvider config={invalidConfig}>
          <TestComponent />
        </EchoProvider>
      );
    }).not.toThrow();
  });

  test('useEcho hook throws error when used outside provider', () => {
    // Mock console.error to prevent test output pollution
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    consoleSpy.mockRestore();
  });

  test('multiple EchoProvider instances can coexist', () => {
    render(
      <div>
        <EchoProvider config={testConfig}>
          <div data-testid="provider-1">Provider 1</div>
        </EchoProvider>
        <EchoProvider config={testConfig}>
          <div data-testid="provider-2">Provider 2</div>
        </EchoProvider>
      </div>
    );

    expect(screen.getByTestId('provider-1')).toBeInTheDocument();
    expect(screen.getByTestId('provider-2')).toBeInTheDocument();
  });
});

describe.skip('EchoProvider State Management', () => {
  test('initial state is correct', async () => {
    render(
      <EchoProvider config={testConfig}>
        <TestComponent />
      </EchoProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'not-authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  test('handles environment-specific initialization', () => {
    // Test browser environment
    const mockUserManager = {
      getUser: jest.fn().mockResolvedValue(null),
      events: {
        addUserLoaded: jest.fn(),
        addUserUnloaded: jest.fn(),
        addAccessTokenExpiring: jest.fn(),
        addAccessTokenExpired: jest.fn(),
        addSilentRenewError: jest.fn(),
        removeUserLoaded: jest.fn(),
        removeUserUnloaded: jest.fn(),
        removeAccessTokenExpiring: jest.fn(),
        removeAccessTokenExpired: jest.fn(),
        removeSilentRenewError: jest.fn(),
      },
    };

    // @ts-ignore
    global.window.__echoUserManager = mockUserManager;

    render(
      <EchoProvider config={testConfig}>
        <TestComponent />
      </EchoProvider>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});
