'use client';

import React from 'react';
import { useEffect } from 'react';
import { Key, Calendar, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiKeysSettings } from '@/hooks/useApiKeysSettings';

interface ApiKeysSettingsProps {
  appId: string;
  appName: string;
}

export default function ApiKeysSettings({
  appId,
  appName,
}: ApiKeysSettingsProps) {
  const { apiKeys, loading, error, pagination, fetchApiKeys } =
    useApiKeysSettings(appId);
  const [copied, setCopied] = React.useState(false);
  const [apiKeyLink, setApiKeyLink] = React.useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    setApiKeyLink(`${window.location.origin}/cli-auth?appId=${appId}`);
  }, [appId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKeyLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading && !apiKeys.length) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">API Keys</h3>
        <p className="text-sm text-muted-foreground">
          View and manage API keys for your app
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="text-sm text-destructive-foreground">{error}</div>
        </div>
      )}

      {/* Customer API Key Creation Link */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center mb-4">
          <ExternalLink className="h-5 w-5 mr-2 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">
            Share API Key Creation Link
          </h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Share this link with your customers so they can create API keys for
          your app. They&apos;ll be automatically enrolled as customers when
          they visit this link.
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-muted/20 border border-border rounded-lg font-mono text-sm text-foreground">
            {apiKeyLink}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
          </Button>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a href={apiKeyLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="ml-1">Preview</span>
            </a>
          </Button>
        </div>
      </div>

      {/* API Keys List */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Key className="h-5 w-5 mr-2 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              API Keys for {appName} ({pagination?.totalCount || 0})
            </h4>
          </div>
          {pagination && pagination.totalCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
        </div>

        {apiKeys.length === 0 ? (
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6 pt-4 border-t border-border/30">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => fetchApiKeys(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => fetchApiKeys(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Showing {apiKeys.length} API key{apiKeys.length !== 1 ? 's' : ''}{' '}
            out of {pagination?.totalCount || 0} total. API keys are ordered by
            creation date, most recent first.
          </p>
        </div>
      </div>
    </div>
  );
}
