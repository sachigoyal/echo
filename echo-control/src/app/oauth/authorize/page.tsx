'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthorizeParams {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  state?: string;
  response_type: string;
}

export default function OAuthAuthorizePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authParams, setAuthParams] = useState<AuthorizeParams | null>(null);

  // Parse OAuth parameters from URL on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setAuthParams({
        client_id: urlParams.get('client_id') || '',
        redirect_uri: urlParams.get('redirect_uri') || '',
        code_challenge: urlParams.get('code_challenge') || '',
        code_challenge_method: urlParams.get('code_challenge_method') || 'S256',
        scope: urlParams.get('scope') || 'llm:invoke offline_access',
        state: urlParams.get('state') || undefined,
        response_type: urlParams.get('response_type') || 'code',
      });
    }
  }, []);

  // Validate required parameters
  useEffect(() => {
    if (
      authParams &&
      (!authParams.client_id ||
        !authParams.redirect_uri ||
        !authParams.code_challenge)
    ) {
      setError('Missing required OAuth parameters');
    }
    if (authParams && authParams.response_type !== 'code') {
      setError('Only authorization code flow is supported');
    }
    if (authParams && authParams.code_challenge_method !== 'S256') {
      setError('Only S256 code challenge method is supported');
    }
  }, [authParams]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn && !error) {
      const currentUrl = window.location.href;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
    }
  }, [isLoaded, isSignedIn, error, router]);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      // Call the authorization API endpoint
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authParams),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to the provided redirect URI with authorization code
        window.location.href = result.redirect_url;
      } else {
        setError(result.error_description || 'Authorization failed');
      }
    } catch {
      setError('Failed to authorize application');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleDeny = () => {
    if (!authParams) return;

    // Redirect back with error
    const redirectUrl = new URL(authParams.redirect_uri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set(
      'error_description',
      'User denied authorization'
    );
    if (authParams.state) {
      redirectUrl.searchParams.set('state', authParams.state);
    }
    window.location.href = redirectUrl.toString();
  };

  if (!isLoaded || !authParams) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Redirecting to sign in...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-red-600">
              Authorization Error
            </h2>
          </div>
          <div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scopes = authParams.scope.split(' ');
  const appName = `Echo App (${authParams.client_id.slice(0, 8)}...)`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Authorize Application</h1>
          <p className="text-gray-600">
            <strong>{appName}</strong> wants to access your Echo account
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">
              This application will be able to:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {scopes.map(scope => (
                <li key={scope} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {scope === 'llm:invoke' &&
                    'Make LLM API requests on your behalf'}
                  {scope === 'offline_access' &&
                    "Access your account when you're not online"}
                  {!['llm:invoke', 'offline_access'].includes(scope) &&
                    `Access: ${scope}`}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <div className="text-xs text-gray-500 mb-4">
              <p>
                <strong>Redirect URI:</strong> {authParams.redirect_uri}
              </p>
              <p>
                <strong>Client ID:</strong> {authParams.client_id}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeny}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={isAuthorizing}
            >
              Deny
            </button>
            <button
              onClick={handleAuthorize}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isAuthorizing}
            >
              {isAuthorizing ? 'Authorizing...' : 'Authorize'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By authorizing, you allow this application to access your Echo
            account according to the permissions listed above.
          </p>
        </div>
      </div>
    </div>
  );
}
