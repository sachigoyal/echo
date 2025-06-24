# JWT Handshake Testing Plan: High-Detail, High-Fidelity

## Overview

This document outlines a comprehensive testing strategy for the Echo React SDK's OAuth2 + PKCE + JWT authentication system. The plan covers unit tests, integration tests, and security test scenarios to ensure robust, secure authentication.

## Architecture Under Test

```
┌─────────────┐    OAuth2/PKCE     ┌─────────────┐    JWT Validation    ┌─────────────┐
│             │◄──────────────────►│             │◄────────────────────►│             │
│ React SDK   │                    │echo-control │                      │echo-server  │
│(Client App) │                    │(Auth Server)│                      │(Resource)   │
└─────────────┘                    └─────────────┘                      └─────────────┘
```

**Key Components:**

- `EchoProvider`: Main React context managing auth state
- `oidc-client-ts`: PKCE flow implementation
- JWT tokens: Short-lived access tokens (24h) + long-lived refresh tokens (30d)
- API endpoints: `/oauth/authorize`, `/oauth/token`, `/api/balance`

---

## 1. Unit Testing Strategy (Mock-Based)

### 1.1 Testing Framework Setup

**Dependencies to Add:**

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2",
    "vitest": "^2.1.8",
    "jsdom": "^26.0.0",
    "msw": "^2.6.4",
    "@vitest/ui": "^2.1.8",
    "jose": "^5.9.6",
    "crypto-js": "^4.2.0"
  }
}
```

### 1.2 Test File Structure

```
src/
├── __tests__/
│   ├── setup.ts                     # Test environment setup
│   ├── mocks/
│   │   ├── handlers.ts              # MSW request handlers
│   │   ├── jwt-factory.ts           # JWT token generation utilities
│   │   └── oidc-client-mock.ts      # Mock oidc-client-ts
│   ├── components/
│   │   ├── EchoProvider.test.tsx    # Main provider tests
│   │   └── EchoSignIn.test.tsx      # Sign-in component tests
│   ├── hooks/
│   │   └── useEcho.test.tsx         # Hook behavior tests
│   ├── security/
│   │   ├── jwt-validation.test.ts   # JWT security tests
│   │   ├── pkce-security.test.ts    # PKCE attack scenarios
│   │   └── oauth-flow.test.ts       # OAuth flow security
│   └── integration/
│       ├── auth-flow.test.tsx       # Complete authentication flows
│       └── token-refresh.test.tsx   # Token refresh scenarios
└── vitest.config.ts                 # Vitest configuration
```

### 1.3 Mock Strategy

**MSW Handlers for echo-control endpoints:**

```typescript
// src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import {
  createValidJWT,
  createExpiredJWT,
  createTamperedJWT,
} from './jwt-factory';

export const handlers = [
  // OAuth authorize endpoint
  http.get('http://localhost:3000/api/oauth/authorize', ({ request }) => {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');
    const codeChallenge = url.searchParams.get('code_challenge');

    if (!clientId || !codeChallenge) {
      return HttpResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    // Return authorization code
    return HttpResponse.json({
      redirect_url: `${url.searchParams.get('redirect_uri')}?code=mock_auth_code&state=${url.searchParams.get('state')}`,
    });
  }),

  // Token exchange endpoint
  http.post('http://localhost:3000/api/oauth/token', async ({ request }) => {
    const body = await request.formData();
    const grantType = body.get('grant_type');
    const code = body.get('code');
    const codeVerifier = body.get('code_verifier');

    if (grantType === 'authorization_code') {
      if (!code || !codeVerifier) {
        return HttpResponse.json({ error: 'invalid_request' }, { status: 400 });
      }

      return HttpResponse.json({
        access_token: createValidJWT(),
        token_type: 'Bearer',
        expires_in: 86400,
        refresh_token: 'refresh_mock_token',
        scope: 'llm:invoke offline_access',
      });
    }

    if (grantType === 'refresh_token') {
      return HttpResponse.json({
        access_token: createValidJWT(),
        token_type: 'Bearer',
        expires_in: 86400,
      });
    }

    return HttpResponse.json(
      { error: 'unsupported_grant_type' },
      { status: 400 }
    );
  }),

  // Balance endpoint
  http.get('http://localhost:3000/api/balance', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    return HttpResponse.json({
      credits: 1000,
      currency: 'USD',
    });
  }),
];
```

### 1.4 JWT Factory for Security Testing

```typescript
// src/__tests__/mocks/jwt-factory.ts
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode('test-secret-key');

export async function createValidJWT(overrides = {}) {
  return await new SignJWT({
    userId: 'test-user-123',
    appId: 'test-app-456',
    apiKeyId: 'test-key-789',
    scope: 'llm:invoke offline_access',
    keyVersion: 1,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setAudience('echo-proxy')
    .setIssuer('http://localhost:3000')
    .sign(JWT_SECRET);
}

export async function createExpiredJWT() {
  return await new SignJWT({
    userId: 'test-user-123',
    appId: 'test-app-456',
    scope: 'llm:invoke',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600) // 1 hour ago
    .setExpirationTime(Math.floor(Date.now() / 1000) - 1800) // 30 min ago
    .sign(JWT_SECRET);
}

export async function createTamperedJWT() {
  const validToken = await createValidJWT();
  // Tamper with the signature by replacing last few characters
  return validToken.slice(0, -5) + 'XXXXX';
}

export async function createWrongAudienceJWT() {
  return await createValidJWT({ aud: 'wrong-audience' });
}

export async function createWrongIssuerJWT() {
  return await new SignJWT({
    userId: 'test-user-123',
    scope: 'llm:invoke',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setIssuer('https://malicious-issuer.com')
    .sign(JWT_SECRET);
}
```

---

## 2. Test Categories and Scenarios

### 2.1 Authentication Flow Tests

**Happy Path Tests:**

```typescript
describe('EchoProvider - Authentication Flow', () => {
  test('successful OAuth2 + PKCE flow', async () => {
    // 1. Render provider
    // 2. Trigger sign-in
    // 3. Mock OAuth redirect callback
    // 4. Verify user is authenticated
    // 5. Verify balance is loaded
  });

  test('existing session restoration', async () => {
    // 1. Mock existing valid session in storage
    // 2. Render provider
    // 3. Verify automatic authentication
  });

  test('silent token renewal', async () => {
    // 1. Setup near-expired token
    // 2. Wait for automatic renewal
    // 3. Verify new token received
  });
});
```

**Error Handling Tests:**

```typescript
describe('EchoProvider - Error Scenarios', () => {
  test('network failure during token exchange', async () => {
    // Mock network error, verify error state
  });

  test('invalid authorization code', async () => {
    // Mock 400 response from token endpoint
  });

  test('balance API failure', async () => {
    // Mock auth success but balance failure
  });
});
```

### 2.2 JWT Security Tests

**Token Validation Tests:**

```typescript
describe('JWT Security - Token Validation', () => {
  test('rejects expired JWT tokens', async () => {
    server.use(
      http.get('/api/balance', () => {
        return HttpResponse.json({ error: 'token_expired' }, { status: 401 });
      })
    );

    // Test that expired token triggers re-authentication
  });

  test('rejects tampered JWT signatures', async () => {
    server.use(
      http.post('/api/oauth/token', () => {
        return HttpResponse.json({
          access_token: await createTamperedJWT(),
          // ... other fields
        });
      })
    );

    // Verify that tampered token is rejected by API calls
  });

  test('rejects JWT with wrong audience', async () => {
    server.use(
      http.post('/api/oauth/token', () => {
        return HttpResponse.json({
          access_token: await createWrongAudienceJWT(),
          // ... other fields
        });
      })
    );

    // Verify API calls fail with wrong audience
  });

  test('rejects JWT with wrong issuer', async () => {
    // Similar test for wrong issuer
  });

  test('JWT replay attack prevention', async () => {
    // 1. Use token successfully
    // 2. Try to reuse same token after normal expiry
    // 3. Verify rejection
  });
});
```

**Token Storage Security:**

```typescript
describe('JWT Security - Storage', () => {
  test('access token stored only in memory', async () => {
    // 1. Complete authentication
    // 2. Check localStorage/sessionStorage is empty
    // 3. Verify token only in React state
  });

  test('refresh token not accessible to JavaScript', async () => {
    // 1. Complete authentication
    // 2. Verify refresh token not in accessible storage
    // 3. Check it's httpOnly cookie (simulated)
  });

  test('tokens cleared on sign out', async () => {
    // 1. Authenticate
    // 2. Sign out
    // 3. Verify all tokens cleared
  });
});
```

### 2.3 PKCE Security Tests

**Code Challenge/Verifier Tests:**

```typescript
describe('PKCE Security', () => {
  test('code verifier correctly generates challenge', async () => {
    // Mock oidc-client-ts to expose PKCE parameters
    // Verify SHA256(code_verifier) === code_challenge
  });

  test('rejects mismatched code verifier', async () => {
    server.use(
      http.post('/api/oauth/token', () => {
        return HttpResponse.json(
          {
            error: 'invalid_grant',
            error_description: 'PKCE verification failed',
          },
          { status: 400 }
        );
      })
    );

    // Verify error handling when PKCE fails
  });

  test('authorization code single-use enforcement', async () => {
    // 1. Use authorization code once successfully
    // 2. Try to reuse same code
    // 3. Verify rejection
  });

  test('authorization code expiry (5 minutes)', async () => {
    // Mock expired authorization code scenario
  });
});
```

### 2.4 OAuth Flow Security Tests

**CSRF Protection:**

```typescript
describe('OAuth Flow Security - CSRF', () => {
  test('state parameter validation', async () => {
    // 1. Start OAuth with state=X
    // 2. Mock callback with state=Y
    // 3. Verify rejection
  });

  test('missing state parameter handling', async () => {
    // Test behavior when state is missing
  });
});
```

**Redirect URI Validation:**

```typescript
describe('OAuth Flow Security - Redirect URI', () => {
  test('validates redirect_uri against registered URLs', async () => {
    server.use(
      http.get('/api/oauth/authorize', () => {
        return HttpResponse.json(
          {
            error: 'invalid_request',
            error_description: 'redirect_uri not authorized',
          },
          { status: 400 }
        );
      })
    );

    // Test handling of unauthorized redirect URI
  });

  test('prevents open redirect attacks', async () => {
    // Attempt redirect to malicious domain
    // Verify proper rejection
  });
});
```

### 2.5 Session Management Tests

**Token Lifecycle:**

```typescript
describe('Session Management', () => {
  test('automatic token refresh before expiry', async () => {
    // 1. Set token to expire in 1 minute
    // 2. Wait and verify refresh triggered
    // 3. Verify new token received
  });

  test('refresh token rotation', async () => {
    // 1. Use refresh token
    // 2. Verify new refresh token issued
    // 3. Verify old refresh token invalidated
  });

  test('handles refresh token expiry gracefully', async () => {
    server.use(
      http.post('/api/oauth/token', () => {
        return HttpResponse.json({ error: 'invalid_grant' }, { status: 400 });
      })
    );

    // Verify user prompted to re-authenticate
  });

  test('concurrent refresh token usage prevention', async () => {
    // Simulate multiple tabs trying to refresh simultaneously
    // Verify only one succeeds, others handle gracefully
  });
});
```

### 2.6 Error Boundary and Recovery Tests

**Network Resilience:**

```typescript
describe('Error Recovery', () => {
  test('handles temporary network outages', async () => {
    // 1. Mock network failure
    // 2. Verify error state
    // 3. Mock network recovery
    // 4. Verify automatic retry
  });

  test('handles malformed server responses', async () => {
    server.use(
      http.post('/api/oauth/token', () => {
        return HttpResponse.text('Invalid JSON response');
      })
    );

    // Verify graceful error handling
  });

  test('handles unexpected server errors (5xx)', async () => {
    server.use(
      http.get('/api/balance', () => {
        return HttpResponse.json(
          { error: 'internal_server_error' },
          { status: 500 }
        );
      })
    );

    // Verify error display and retry logic
  });
});
```

---

## 3. Performance and Load Testing

### 3.1 Token Management Performance

```typescript
describe('Performance Tests', () => {
  test('JWT validation performance under load', async () => {
    // Simulate 100 rapid API calls
    // Verify response times remain acceptable
  });

  test('memory usage during long sessions', async () => {
    // Run 1000+ token refresh cycles
    // Monitor memory usage
  });

  test('concurrent session handling', async () => {
    // Simulate multiple EchoProvider instances
    // Verify no conflicts or race conditions
  });
});
```

---

## 4. Integration Test Strategy

### 4.1 End-to-End Flow Testing

**With Real echo-control (Docker Setup):**

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: echo_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - '5433:5432'

  echo-control-test:
    build: ../echo-control
    environment:
      DATABASE_URL: postgresql://test:test@postgres-test:5432/echo_test
      OAUTH_JWT_SECRET: test-secret-key
      NODE_ENV: test
    ports:
      - '3001:3000'
    depends_on:
      - postgres-test
```

**Integration Test Examples:**

```typescript
describe('Integration Tests (Real Backend)', () => {
  beforeAll(async () => {
    // Start Docker containers
    // Setup test database with fixtures
  });

  test('complete OAuth flow with real backend', async () => {
    // 1. Create test Echo app in database
    // 2. Run full OAuth flow
    // 3. Verify database state changes
    // 4. Test API calls with real JWT validation
  });

  test('JWT token validation by echo-server', async () => {
    // 1. Get token from echo-control
    // 2. Make API call to echo-server
    // 3. Verify successful validation
  });
});
```

---

## 5. Security Penetration Testing

### 5.1 Attack Simulation Tests

**JWT Attacks:**

```typescript
describe('Security Penetration Tests', () => {
  test('JWT algorithm confusion attack', async () => {
    // Attempt to use "none" algorithm
    // Verify rejection
  });

  test('JWT key confusion attack', async () => {
    // Use public key as HMAC secret
    // Verify rejection
  });

  test('JWT time manipulation', async () => {
    // Manually craft JWT with future timestamps
    // Verify rejection
  });
});
```

**OAuth Attacks:**

```typescript
describe('OAuth Attack Scenarios', () => {
  test('authorization code interception', async () => {
    // Simulate man-in-the-middle attack
    // Verify PKCE prevents exploitation
  });

  test('client impersonation', async () => {
    // Use wrong client_id with valid code
    // Verify rejection
  });

  test('scope escalation attempt', async () => {
    // Request higher privileges than authorized
    // Verify proper scope enforcement
  });
});
```

---

## 6. CI/CD Integration

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/test-jwt-security.yml
name: JWT Security Tests

on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd echo-react-sdk && bun install

      - name: Run unit tests
        run: cd echo-react-sdk && bun test

      - name: Run security tests
        run: cd echo-react-sdk && bun test:security

      - name: Start echo-control
        run: |
          cd echo-control
          docker-compose -f docker-compose.test.yml up -d

      - name: Run integration tests
        run: cd echo-react-sdk && bun test:integration

      - name: Generate security report
        run: cd echo-react-sdk && bun test:security:report
```

### 6.2 Test Coverage Requirements

**Minimum Coverage Targets:**

- Unit tests: 95% line coverage
- Security tests: 100% of attack vectors covered
- Integration tests: All critical paths covered

---

## 7. Test Utilities and Helpers

### 7.1 Test Wrapper Components

```typescript
// src/__tests__/utils/TestEchoProvider.tsx
export function TestEchoProvider({
  children,
  mockConfig = {},
  mockResponses = {}
}) {
  const config = {
    appId: 'test-app-id',
    apiUrl: 'http://localhost:3000',
    ...mockConfig
  };

  return (
    <EchoProvider config={config}>
      {children}
    </EchoProvider>
  );
}
```

### 7.2 Custom Test Hooks

```typescript
// src/__tests__/utils/test-hooks.ts
export function renderWithEcho(component, options = {}) {
  return render(
    <TestEchoProvider {...options}>
      {component}
    </TestEchoProvider>
  );
}

export async function waitForAuthentication() {
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
}
```

---

## 8. Monitoring and Alerting

### 8.1 Test Metrics to Track

**Security Metrics:**

- JWT signature validation failures
- PKCE verification failures
- Token expiry handling accuracy
- Refresh token rotation success rate

**Performance Metrics:**

- Authentication flow completion time
- Token refresh latency
- Memory usage over time
- Error recovery time

### 8.2 Automated Security Scanning

**Daily Security Tests:**

```bash
# Automated daily security scan
bun test:security --reporter=json > security-report.json
./scripts/check-security-baseline.js security-report.json
```

---

## Summary

This testing plan provides:

1. **Comprehensive Coverage**: 95%+ test coverage across all authentication flows
2. **Security-First Approach**: Dedicated tests for all known JWT/OAuth attack vectors
3. **CI/CD Integration**: Automated testing in GitHub Actions with real backend
4. **Performance Validation**: Load testing and memory usage monitoring
5. **Attack Simulation**: Penetration testing scenarios
6. **Developer Experience**: Easy-to-use test utilities and helpers

**Next Steps:**

1. Implement MSW mock handlers
2. Create JWT factory utilities
3. Write core authentication flow tests
4. Add security penetration tests
5. Setup CI/CD pipeline
6. Document security test results

This plan ensures your JWT handshake system is thoroughly tested, secure, and maintainable.
