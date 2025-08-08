'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { Copy, Check, Terminal, Key } from 'lucide-react';

import Link from 'next/link';

import { useSearchParams } from 'next/navigation';

import { useUser } from '@/hooks/use-user';

interface EchoApp {
  id: string;
  name: string;
  description?: string;
}

function CLIAuthContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<EchoApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [apiKeyName, setApiKeyName] = useState('CLI Access');
  const [generatedApiKey, setGeneratedApiKey] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string>('');

  const fetchApps = useCallback(async () => {
    try {
      const response = await fetch('/api/apps');
      if (response.ok) {
        const data = await response.json();
        setApps(data.apps);
        if (data.apps.length > 0) {
          setSelectedAppId(data.apps[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    }
  }, []);

  const handleAppIdFromUrl = useCallback(
    async (appId: string) => {
      setIsEnrolling(true);
      setEnrollmentError('');

      try {
        // First, check if the user already has access to this app
        const response = await fetch('/api/apps');
        if (response.ok) {
          const data = await response.json();
          const existingApp = data.apps.find(
            (app: EchoApp) => app.id === appId
          );

          if (existingApp) {
            // User already has access, just set it as selected
            setApps(data.apps);
            setSelectedAppId(appId);
            setIsEnrolling(false);
            return;
          }
        }

        // User doesn't have access, try to enroll them as a customer
        const enrollResponse = await fetch(
          `/api/owner/apps/${appId}/customers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // Empty body means enroll current user
          }
        );

        if (enrollResponse.ok) {
          // Successfully enrolled, now refetch all apps to include the newly joined app
          await fetchApps();
          setSelectedAppId(appId);
        } else {
          const errorData = await enrollResponse.json();
          if (enrollResponse.status === 404) {
            setEnrollmentError('App not found or inactive');
          } else {
            setEnrollmentError(errorData.error || 'Failed to join app');
          }
        }
      } catch (error) {
        console.error('Failed to handle app enrollment:', error);
        setEnrollmentError('Failed to join app');
      } finally {
        setIsEnrolling(false);
      }
    },
    [fetchApps]
  );

  useEffect(() => {
    if (isLoaded && user) {
      const appIdFromUrl = searchParams.get('appId');
      if (appIdFromUrl) {
        handleAppIdFromUrl(appIdFromUrl);
      } else {
        fetchApps();
      }
    }
  }, [isLoaded, user, searchParams, handleAppIdFromUrl, fetchApps]);

  const generateApiKey = async () => {
    if (!selectedAppId) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          echoAppId: selectedAppId,
          name: apiKeyName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedApiKey(data.apiKey.key);
      } else {
        console.error('Failed to generate API key');
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md">
          <div className="text-center">
            <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-card-foreground mb-2">
              CLI Authentication
            </h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to generate an API key for CLI access.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show enrollment status if currently enrolling
  if (isEnrolling) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-card-foreground flex items-center gap-3">
            <Terminal className="w-8 h-8" />
            CLI Authentication
          </h1>
          <p className="text-muted-foreground mt-2">
            Setting up access to the Echo app...
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <span className="ml-3 text-muted-foreground">Joining app...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show enrollment error if any
  if (enrollmentError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-card-foreground flex items-center gap-3">
            <Terminal className="w-8 h-8" />
            CLI Authentication
          </h1>
          <p className="text-muted-foreground mt-2">
            Unable to access the requested app.
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Terminal className="w-12 h-12 mx-auto mb-2" />
              <h2 className="text-lg font-semibold">Access Error</h2>
            </div>
            <p className="text-muted-foreground mb-6">{enrollmentError}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setEnrollmentError('');
                  fetchApps();
                }}
                className="px-4 py-2 border border-input bg-input text-input-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                View My Apps
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-card-foreground flex items-center gap-3">
          <Terminal className="w-8 h-8" />
          CLI Authentication
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate an API key to authenticate with the Echo CLI. Each API key is
          scoped to a specific Echo app.
        </p>
        {searchParams.get('appId') && selectedAppId && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ You&apos;ve been successfully added as a customer to this app
              and can now generate an API key.
            </p>
          </div>
        )}
      </div>

      {!generatedApiKey ? (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-card-foreground">
              Generate App-Scoped API Key
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="app-select"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Select Echo App <span className="text-red-500">*</span>
              </label>
              <select
                id="app-select"
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                disabled={searchParams.get('appId') ? true : false}
                className="w-full px-3 py-2 border border-input bg-input text-input-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Choose an app</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
              {apps.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No apps found. Create an app first in your{' '}
                  <Link href="/" className="text-accent hover:underline">
                    dashboard
                  </Link>
                  .
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {searchParams.get('appId')
                  ? 'This app was pre-selected from your invitation link.'
                  : 'API keys are scoped to specific apps and can only access resources for the selected app.'}
              </p>
            </div>

            <div>
              <label
                htmlFor="api-key-name"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                API Key Name
              </label>
              <input
                id="api-key-name"
                type="text"
                value={apiKeyName}
                onChange={e => setApiKeyName(e.target.value)}
                placeholder="Enter a name for this API key"
                className="w-full px-3 py-2 border border-input bg-input text-input-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-muted-foreground"
              />
            </div>

            <button
              onClick={generateApiKey}
              disabled={!selectedAppId || isGenerating}
              className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate API Key'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 text-green-600 mb-6">
            <Check className="w-5 h-5" />
            <h2 className="text-lg font-semibold">
              App-Scoped API Key Generated
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Your API Key
              </label>
              <div className="flex items-center gap-2">
                <textarea
                  value={generatedApiKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-input bg-input text-input-foreground rounded-md font-mono text-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 border border-input bg-input text-input-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Important Security Notice
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Keep this API key secure and never share it publicly</li>
                <li>• This key provides access to your Echo account</li>
                <li>• This key is scoped only to the selected Echo app</li>
                <li>• Store it safely in your CLI tool</li>
                <li>
                  • You won&apos;t be able to see this key again after leaving
                  this page
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Copy the API key above</li>
                <li>2. Return to your terminal</li>
                <li>3. Paste the API key when prompted</li>
                <li>4. Start using the Echo CLI with this app!</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setGeneratedApiKey('')}
                className="flex-1 px-4 py-2 border border-input bg-input text-input-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Generate Another Key
              </button>
              <Link
                href="/"
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors text-center"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CLIAuthPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <CLIAuthContent />
    </React.Suspense>
  );
}
