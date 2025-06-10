# OAuth 2.0 PKCE Setup for Echo Apps

This document explains how to set up and use the OAuth 2.0 PKCE (Proof Key for Code Exchange) flow for Echo apps to authenticate with Echo Control.

## Overview

The OAuth PKCE flow allows Echo app frontends to:

1. Authenticate users via Echo Control (using Clerk)
2. Obtain API keys programmatically
3. Make authenticated requests to Echo Server

## Setup

### 1. Environment Variables

Add to your `.env.local` file:

```bash
# OAuth JWT secret for signing authorization codes
OAUTH_JWT_SECRET=your-super-secret-jwt-key-here-change-in-production

# Existing variables...
DATABASE_URL=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

**Important**: Use a strong, random secret for `OAUTH_JWT_SECRET` in production.

### 2. Dependencies

The following packages are now installed:

- `jose` - For JWT signing and verification

### 3. Database Schema

No database changes are required! The implementation uses your existing:

- `User` table (via Clerk integration)
- `EchoApp` table (created/found automatically)
- `ApiKey` table (created automatically)

## API Endpoints

### Authorization Endpoint

```
GET /api/oauth/authorize
```

**Parameters:**

- `client_id` - Your Echo app ID
- `redirect_uri` - Your app's callback URL
- `code_challenge` - PKCE code challenge (base64url-encoded SHA256 hash)
- `code_challenge_method` - Must be `S256`
- `response_type` - Must be `code`
- `scope` - Optional, defaults to `llm:invoke offline_access`
- `state` - Optional, recommended for CSRF protection

**Response:** Redirects to `redirect_uri` with authorization code

### Token Endpoint

```
POST /api/oauth/token
```

**Request Body:**

```json
{
  "grant_type": "authorization_code",
  "code": "authorization_code_from_callback",
  "redirect_uri": "your_callback_url",
  "client_id": "your_echo_app_id",
  "code_verifier": "pkce_code_verifier"
}
```

**Response:**

```json
{
  "access_token": "echo_api_key_here",
  "token_type": "Bearer",
  "scope": "llm:invoke offline_access",
  "expires_in": null,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "echo_app": {
    "id": "app_id",
    "name": "Echo App Name",
    "description": "App description"
  }
}
```

## Client Usage

### Option 1: Browser Client (Recommended for Web Apps)

```typescript
import { BrowserOAuthClient } from '@/lib/oauth-client';

const client = new BrowserOAuthClient({
  authorizationUrl: 'https://echo.merit.systems/api/oauth/authorize',
  tokenUrl: 'https://echo.merit.systems/api/oauth/token',
  clientId: 'your-echo-app-id', // Generate a UUID for your app
  redirectUri: 'http://localhost:3000/auth/callback',
});

// Start OAuth flow (redirects user to Echo Control)
function startAuth() {
  client.authorize('optional-state-parameter');
}

// Handle callback (on your redirect URI page)
async function handleCallback() {
  try {
    const token = await client.handleCallback();

    // Store the API key for later use
    localStorage.setItem('echo_api_key', token.access_token);

    console.log('Authenticated!', token.user);
    console.log('API Key:', token.access_token);
  } catch (error) {
    console.error('OAuth failed:', error);
  }
}
```

### Option 2: Manual Implementation

```typescript
import { EchoOAuthClient } from '@/lib/oauth-client';

const client = new EchoOAuthClient({
  authorizationUrl: 'https://echo.merit.systems/api/oauth/authorize',
  tokenUrl: 'https://echo.merit.systems/api/oauth/token',
  clientId: 'your-echo-app-id',
  redirectUri: 'http://localhost:3000/auth/callback',
});

// Get authorization URL
const authUrl = client.getAuthorizationUrl('state-parameter');
// Redirect user to authUrl...

// Exchange code for token (on callback)
const token = await client.exchangeCodeForToken(authorizationCode);
```

## Integration with Existing Echo Apps

### For React/Next.js Apps

1. **Create an auth callback page:**

```typescript
// pages/auth/callback.tsx or app/auth/callback/page.tsx
import { useEffect } from 'react';
import { BrowserOAuthClient } from '@/lib/oauth-client';

export default function AuthCallback() {
  useEffect(() => {
    const client = new BrowserOAuthClient({
      authorizationUrl: 'https://echo.merit.systems/api/oauth/authorize',
      tokenUrl: 'https://echo.merit.systems/api/oauth/token',
      clientId: process.env.NEXT_PUBLIC_ECHO_APP_ID!,
      redirectUri: `${window.location.origin}/auth/callback`,
    });

    client.handleCallback()
      .then(token => {
        localStorage.setItem('echo_api_key', token.access_token);
        window.location.href = '/dashboard'; // Redirect to your app
      })
      .catch(error => {
        console.error('Auth failed:', error);
        window.location.href = '/login?error=oauth_failed';
      });
  }, []);

  return <div>Completing authentication...</div>;
}
```

2. **Add login button:**

```typescript
import { BrowserOAuthClient } from '@/lib/oauth-client';

function LoginButton() {
  const handleLogin = () => {
    const client = new BrowserOAuthClient({
      authorizationUrl: 'https://echo.merit.systems/api/oauth/authorize',
      tokenUrl: 'https://echo.merit.systems/api/oauth/token',
      clientId: process.env.NEXT_PUBLIC_ECHO_APP_ID!,
      redirectUri: `${window.location.origin}/auth/callback`,
    });

    client.authorize();
  };

  return (
    <button onClick={handleLogin}>
      Connect to Echo
    </button>
  );
}
```

### Using the API Key

Once you have the API key, use it for Echo Server requests:

```typescript
const apiKey = localStorage.getItem('echo_api_key');

// Make requests to Echo Server
const response = await fetch(
  'https://your-echo-server.com/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }],
    }),
  }
);
```

## Security Considerations

1. **PKCE**: The implementation uses PKCE for security without requiring client secrets
2. **State Parameter**: Always use the state parameter to prevent CSRF attacks
3. **JWT Secrets**: Use a strong, random secret for `OAUTH_JWT_SECRET`
4. **HTTPS**: Always use HTTPS in production for redirect URIs
5. **Scope**: Tokens are scoped to specific permissions (`llm:invoke offline_access`)

## Flow Diagram

```
┌─────────────┐    1. Authorization Request     ┌─────────────────┐
│             │ ────────────────────────────────>│                 │
│ Echo App    │                                 │ Echo Control    │
│ Frontend    │    2. User authenticates        │ (Clerk)         │
│             │ <───────────────────────────────│                 │
└─────────────┘                                 └─────────────────┘
       │                3. Authorization Code            │
       │ <───────────────────────────────────────────────│
       │                                                 │
       │         4. Exchange Code for Token              │
       │ ────────────────────────────────────────────────>│
       │                                                 │
       │              5. API Key Response                │
       │ <───────────────────────────────────────────────│
       │                                                 │
       │         6. Use API Key for requests             │
       │ ────────────────────────────────────────────────>│
```

## Troubleshooting

### Common Issues

1. **"Invalid or expired authorization code"**

   - Check that your JWT secret matches between authorize and token endpoints
   - Ensure the authorization code hasn't expired (5 minute TTL)

2. **"PKCE verification failed"**

   - Verify that the code_verifier matches the original code_challenge
   - Check that you're using SHA256 hashing and base64url encoding

3. **"User not found"**

   - Ensure the user has signed up through Echo Control first
   - Check that Clerk is properly configured

4. **Redirect URI mismatch**
   - Ensure the redirect_uri in both authorize and token requests match exactly
   - Check for trailing slashes and protocol mismatches

### Debug Mode

Add logging to see the OAuth flow:

```typescript
// In your OAuth client
console.log('Authorization URL:', authUrl);
console.log('Code received:', code);
console.log('Token response:', token);
```

## Next Steps

- Test the flow with a simple Echo app
- Configure production environment variables
- Set up proper error handling and user feedback
- Consider implementing refresh tokens for long-lived sessions
