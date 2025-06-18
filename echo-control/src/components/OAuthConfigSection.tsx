'use client';

import { Check, Copy, ExternalLink, Shield, Trash } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { GlassButton } from './glass-button';

interface OAuthConfigSectionProps {
  appId: string;
}

interface OAuthConfig {
  client_id: string;
  name: string;
  description: string;
  is_active: boolean;
  authorized_callback_urls: string[];
  oauth_endpoints: {
    authorization_url: string;
    token_url: string;
    refresh_url: string;
  };
}

export default function OAuthConfigSection({ appId }: OAuthConfigSectionProps) {
  const [config, setConfig] = useState<OAuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchOAuthConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/apps/${appId}/oauth-config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else if (response.status === 404) {
        // App exists but no OAuth config yet - that's fine
        setConfig(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to load OAuth configuration');
      }
    } catch {
      setError('Failed to load OAuth configuration');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchOAuthConfig();
  }, [appId, fetchOAuthConfig]);

  const handleAddCallbackUrl = async () => {
    if (!newUrl.trim()) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/apps/${appId}/oauth-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_url: newUrl.trim() }),
      });

      if (response.ok) {
        setNewUrl('');
        await fetchOAuthConfig(); // Refresh config
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add callback URL');
      }
    } catch {
      alert('Failed to add callback URL');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCallbackUrl = async (url: string) => {
    try {
      const response = await fetch(`/api/apps/${appId}/oauth-config`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_url: url }),
      });

      if (response.ok) {
        await fetchOAuthConfig(); // Refresh config
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove callback URL');
      }
    } catch {
      alert('Failed to remove callback URL');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-card-foreground" />
          <h2 className="text-lg font-semibold text-card-foreground">
            OAuth Configuration
          </h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-card-foreground" />
          <h2 className="text-lg font-semibold text-card-foreground">
            OAuth Configuration
          </h2>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-5 w-5 text-card-foreground" />
        <h2 className="text-lg font-semibold text-card-foreground">
          OAuth Configuration
        </h2>
      </div>

      {/* OAuth Endpoints */}
      <div className="space-y-4 mb-8">
        <h3 className="text-md font-medium text-card-foreground">
          OAuth Endpoints
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Client ID
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono text-card-foreground">
                {appId}
              </code>
              <button
                onClick={() => copyToClipboard(appId, 'client_id')}
                className="!h-10 !w-10"
              >
                {copiedField === 'client_id' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {config && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Authorization URL
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono text-card-foreground break-all">
                    {config.oauth_endpoints.authorization_url}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        config.oauth_endpoints.authorization_url,
                        'auth_url'
                      )
                    }
                    className="!h-10 !w-10"
                  >
                    {copiedField === 'auth_url' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Token URL
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono text-card-foreground break-all">
                    {config.oauth_endpoints.token_url}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        config.oauth_endpoints.token_url,
                        'token_url'
                      )
                    }
                    className="!h-10 !w-10"
                  >
                    {copiedField === 'token_url' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Refresh URL
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono text-card-foreground break-all">
                    {config.oauth_endpoints.refresh_url}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        config.oauth_endpoints.refresh_url,
                        'refresh_url'
                      )
                    }
                    className="!h-10 !w-10"
                  >
                    {copiedField === 'refresh_url' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Authorized Callback URLs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-card-foreground">
            Authorized Callback URLs
          </h3>
          <a
            href="https://www.oauth.com/oauth2-servers/redirect-uris/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-muted-foreground hover:text-card-foreground"
          >
            Learn more <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground">
          Add the URLs where users should be redirected after OAuth
          authorization. Only HTTPS URLs are allowed in production (except
          localhost).
        </p>

        {/* Add new URL */}
        <div className="flex space-x-2">
          <input
            type="url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://yourapp.com/auth/callback"
            className="flex-1 px-3 py-2 border border-input bg-input rounded-md text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <GlassButton
            onClick={handleAddCallbackUrl}
            disabled={!newUrl.trim() || adding}
            variant="secondary"
          >
            Add URI
          </GlassButton>
        </div>

        {/* List existing URLs */}
        {config && config.authorized_callback_urls.length > 0 ? (
          <div className="space-y-2">
            {config.authorized_callback_urls.map((url, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <code className="text-sm font-mono text-card-foreground break-all">
                  {url}
                </code>
                <button
                  onClick={() => handleRemoveCallbackUrl(url)}
                  className="!h-8 !w-8"
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <Shield className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="text-sm font-medium text-card-foreground">
              No callback URLs configured
            </h4>
            <p className="text-sm text-muted-foreground">
              Add authorized callback URLs to enable OAuth authentication
            </p>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium text-card-foreground mb-2">
          Quick Start
        </h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Add your application&apos;s callback URLs above</li>
          <li>Use the Client ID and OAuth endpoints in your app</li>
          <li>Implement PKCE flow for secure authentication</li>
          <li>Exchange authorization codes for API keys</li>
        </ol>
      </div>
    </div>
  );
}
