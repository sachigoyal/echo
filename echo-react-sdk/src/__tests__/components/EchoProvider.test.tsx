import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { errorHandlers } from '../mocks/handlers';
import {
  renderWithEcho,
  createMockUserManager,
  createMockAuthenticatedUser,
  mockOAuthCallback,
  resetUrl,
  expectTokensNotInStorage,
} from '../utils/test-helpers';
import { useEcho } from '../../hooks/useEcho';

// Test component to access EchoProvider context
function TestComponent() {
  const {
    user,
    balance,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    refreshBalance,
  } = useEcho();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading...' : 'Ready'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      <div data-testid="user">{user ? `User: ${user.name}` : 'No user'}</div>
      <div data-testid="balance">
        {balance ? `Credits: ${balance.credits}` : 'No balance'}
      </div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={signIn} data-testid="sign-in">
        Sign In
      </button>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
      <button onClick={refreshBalance} data-testid="refresh-balance">
        Refresh Balance
      </button>
    </div>
  );
}

describe('EchoProvider', () => {
  beforeEach(() => {
    resetUrl();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Authentication Flow', () => {
    test('initializes in loading state', () => {
      renderWithEcho(<TestComponent />);

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Not authenticated'
      );
    });

    test('completes successful OAuth flow', async () => {
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        signinRedirectCallback: vi.fn().mockResolvedValue(mockUser),
      });

      // Simulate OAuth callback
      mockOAuthCallback({ code: 'test-auth-code', state: 'test-state' });

      await act(async () => {
        renderWithEcho(<TestComponent />, { mockUserManager });
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
      });

      expect(screen.getByTestId('user')).toHaveTextContent('User: Test User');
      expect(screen.getByTestId('balance')).toHaveTextContent('Credits: 1000');
      expect(mockUserManager.signinRedirectCallback).toHaveBeenCalled();

      // Verify URL cleanup
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        expect.any(String),
        '/'
      );
    });

    test('handles existing session restoration', async () => {
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
      });

      expect(screen.getByTestId('user')).toHaveTextContent('User: Test User');
      expect(mockUserManager.getUser).toHaveBeenCalled();
    });

    test('handles sign in redirect', async () => {
      const user = userEvent.setup();
      const mockUserManager = createMockUserManager();

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
      });

      await user.click(screen.getByTestId('sign-in'));

      expect(mockUserManager.signinRedirect).toHaveBeenCalled();
    });

    test('handles sign out', async () => {
      const user = userEvent.setup();
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
      });

      await user.click(screen.getByTestId('sign-out'));

      expect(mockUserManager.signoutRedirect).toHaveBeenCalled();
    });

    test('refreshes balance on demand', async () => {
      const user = userEvent.setup();
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('balance')).toHaveTextContent(
          'Credits: 1000'
        );
      });

      await user.click(screen.getByTestId('refresh-balance'));

      expect(screen.getByTestId('balance')).toHaveTextContent('Credits: 1000');
    });
  });

  describe('Error Handling', () => {
    test('handles OAuth callback errors', async () => {
      const mockUserManager = createMockUserManager({
        signinRedirectCallback: vi
          .fn()
          .mockRejectedValue(new Error('OAuth failed')),
      });

      mockOAuthCallback({ code: 'invalid-code' });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('OAuth failed');
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Not authenticated'
        );
      });
    });

    test('handles balance API failure gracefully', async () => {
      server.use(errorHandlers.unauthorizedBalance);

      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
        expect(screen.getByTestId('user')).toHaveTextContent('User: Test User');
      });
    });

    test('handles sign out failure gracefully', async () => {
      const user = userEvent.setup();
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
        signoutRedirect: vi
          .fn()
          .mockRejectedValue(new Error('Sign out failed')),
        removeUser: vi.fn().mockResolvedValue(undefined),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
      });

      await user.click(screen.getByTestId('sign-out'));

      // Should clear local state even if redirect fails
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Not authenticated'
        );
      });

      expect(mockUserManager.removeUser).toHaveBeenCalled();
    });
  });

  describe('Security', () => {
    test('does not store tokens in localStorage or sessionStorage', async () => {
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
      });

      expectTokensNotInStorage();
    });

    test('clears all state on sign out', async () => {
      const user = userEvent.setup();
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
        expect(screen.getByTestId('user')).toHaveTextContent('User: Test User');
        expect(screen.getByTestId('balance')).toHaveTextContent(
          'Credits: 1000'
        );
      });

      await user.click(screen.getByTestId('sign-out'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Not authenticated'
        );
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
        expect(screen.getByTestId('balance')).toHaveTextContent('No balance');
      });
    });

    test('handles expired session gracefully', async () => {
      const mockUser = {
        ...(await createMockAuthenticatedUser()),
        expired: true,
      };
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Not authenticated'
        );
      });
    });
  });

  describe('Session Management', () => {
    test('sets up token event listeners', async () => {
      const mockUserManager = createMockUserManager();

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
      });

      // Verify event listeners were set up
      expect(mockUserManager.events.addUserLoaded).toHaveBeenCalled();
      expect(mockUserManager.events.addUserUnloaded).toHaveBeenCalled();
      expect(mockUserManager.events.addAccessTokenExpiring).toHaveBeenCalled();
      expect(mockUserManager.events.addAccessTokenExpired).toHaveBeenCalled();
      expect(mockUserManager.events.addSilentRenewError).toHaveBeenCalled();
    });

    test('handles token expiration events', async () => {
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
      });

      // Simulate access token expired event
      const expiredHandler =
        mockUserManager.events.addAccessTokenExpired.mock.calls[0][0];
      await act(async () => {
        expiredHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Session expired. Please sign in again.'
        );
      });
    });

    test('handles silent renewal errors', async () => {
      const mockUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent(
          'Authenticated'
        );
      });

      // Simulate silent renewal error
      const errorHandler =
        mockUserManager.events.addSilentRenewError.mock.calls[0][0];
      await act(async () => {
        errorHandler(new Error('login_required'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Session renewal failed. Please sign in again.'
        );
      });
    });

    test('updates user data after successful renewal', async () => {
      const originalUser = await createMockAuthenticatedUser();
      const renewedUser = await createMockAuthenticatedUser({
        profile: { name: 'Renewed User', email: 'renewed@example.com' },
      });

      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(originalUser),
      });

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('User: Test User');
      });

      // Simulate successful renewal with user loaded event
      const userLoadedHandler =
        mockUserManager.events.addUserLoaded.mock.calls[0][0];
      await act(async () => {
        userLoadedHandler(renewedUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(
          'User: Renewed User'
        );
      });
    });
  });
});
