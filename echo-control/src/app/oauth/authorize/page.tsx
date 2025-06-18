'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GlassButton } from '@/components/glass-button';

interface AuthorizeParams {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  state?: string;
  response_type: string;
}

interface AppOwnerDetails {
  id: string;
  name: string;
  description?: string;
  owner: {
    name: string | null;
    email: string;
  } | null;
}

export default function OAuthAuthorizePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authParams, setAuthParams] = useState<AuthorizeParams | null>(null);
  const [appDetails, setAppDetails] = useState<AppOwnerDetails | null>(null);
  const [loadingAppDetails, setLoadingAppDetails] = useState(false);

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

  // Fetch app owner details when we have authParams
  useEffect(() => {
    if (authParams?.client_id && !appDetails && !loadingAppDetails) {
      setLoadingAppDetails(true);
      fetch(`/api/apps/${authParams.client_id}/owner-details`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to fetch app details');
        })
        .then(data => {
          setAppDetails(data);
        })
        .catch(error => {
          console.error('Error fetching app owner details:', error);
          // Continue with basic fallback info - this is not a critical error
        })
        .finally(() => {
          setLoadingAppDetails(false);
        });
    }
  }, [authParams, appDetails, loadingAppDetails]);

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
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">
            Redirecting to sign in...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg border border-border p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-destructive">
                Authorization Error
              </h2>
            </div>
            <div>
              <p className="text-destructive text-sm">{error}</p>
              <GlassButton
                onClick={() => window.history.back()}
                className="mt-4 w-full"
                variant="secondary"
              >
                Go Back
              </GlassButton>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const scopes = authParams.scope.split(' ');
  const appName =
    appDetails?.name || `Echo App (${authParams.client_id.slice(0, 8)}...)`;
  const ownerName = appDetails?.owner?.name || appDetails?.owner?.email;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
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
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Authorize Application
          </h1>
          <p className="text-muted-foreground">
            Grant access to your Echo account
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 shadow-lg">
          {/* App Information */}
          <div className="text-center mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {appName}
              </h2>
              {ownerName && (
                <p className="text-sm text-muted-foreground">by {ownerName}</p>
              )}
              {appDetails?.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {appDetails.description}
                </p>
              )}
            </div>
            <p className="text-foreground">wants to access your Echo account</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">
                This application will be able to:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {scopes.map(scope => (
                  <li key={scope} className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-500 flex-shrink-0"
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
                    <span>
                      {scope === 'llm:invoke' &&
                        'Make LLM API requests on your behalf'}
                      {scope === 'offline_access' &&
                        "Access your account when you're not online"}
                      {!['llm:invoke', 'offline_access'].includes(scope) &&
                        `Access: ${scope}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>
                  <span className="font-medium">Redirect URI:</span>{' '}
                  {authParams.redirect_uri}
                </p>
                <p>
                  <span className="font-medium">Client ID:</span>{' '}
                  {authParams.client_id}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <GlassButton
                onClick={handleDeny}
                disabled={isAuthorizing}
                variant="secondary"
                className="flex-1"
              >
                Deny
              </GlassButton>
              <GlassButton
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                variant="primary"
                className="flex-1"
              >
                {isAuthorizing ? 'Authorizing...' : 'Authorize'}
              </GlassButton>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By authorizing, you allow this application to access your Echo
              account according to the permissions listed above.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
