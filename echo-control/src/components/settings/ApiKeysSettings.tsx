'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, Calendar } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  userId: string;
  echoAppId: string;
  scope: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface ApiKeysSettingsProps {
  appId: string;
  appName: string;
}

export default function ApiKeysSettings({
  appId,
  appName,
}: ApiKeysSettingsProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/api-keys');

      if (response.ok) {
        const data = await response.json();
        // Filter to only show keys for this specific app
        const appApiKeys = data.apiKeys.filter(
          (key: ApiKey) => key.echoAppId === appId
        );
        setApiKeys(appApiKeys);
      } else {
        throw new Error('Failed to fetch API keys');
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          View and manage API keys for your app
        </p>
      </div>

      {/* API Keys List */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Key className="h-5 w-5 mr-2 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">
            API Keys for {appName}
          </h4>
        </div>

        {error && (
          <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="text-sm text-destructive-foreground">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">
              No API keys yet
            </h4>
            <p className="text-sm text-muted-foreground">
              Customers will need to generate API keys to use your app.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map(apiKey => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-full flex items-center justify-center">
                    <Key className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {apiKey.name || 'Unnamed Key'}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(apiKey.createdAt)}
                      </span>
                      <span>
                        Owner: {apiKey.user.name || apiKey.user.email}
                      </span>
                      <span className="capitalize">{apiKey.scope}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                    {apiKey.scope === 'owner' ? 'App Owner' : 'Customer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Showing {apiKeys.length} API key{apiKeys.length !== 1 ? 's' : ''}{' '}
            for this app. API keys are managed by individual users.
          </p>
        </div>
      </div>
    </div>
  );
}
