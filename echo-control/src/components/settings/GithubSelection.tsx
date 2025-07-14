'use client';

import React, { useState, useCallback } from 'react';
import { GitHubSearchComponent } from '../GitHubSearchComponent';

interface GithubSelectionProps {
  initialGithubId?: string;
  initialGithubType?: 'user' | 'repo' | null;
  onSave: (
    githubId: string | undefined,
    githubType: 'user' | 'repo' | undefined
  ) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function GithubSelection({
  initialGithubId = '',
  initialGithubType = null,
  onSave,
  isLoading = false,
  error = null,
}: GithubSelectionProps) {
  // Internal state for the GitHub selection
  const [pendingGithubId, setPendingGithubId] = useState(initialGithubId);
  const [isSaving, setIsSaving] = useState(false);

  // Handle GitHub selection from search component - auto-save on change
  const handleGithubChange = useCallback(
    async (
      value: string,
      verified: boolean,
      metadata?: unknown,
      detectedType?: 'user' | 'repo'
    ) => {
      const newType = detectedType || null;
      const trimmedValue = value.trim();

      // Update local state immediately for UI responsiveness
      setPendingGithubId(trimmedValue);

      // Auto-save the changes
      try {
        setIsSaving(true);
        const githubId = trimmedValue || undefined;
        const githubType = githubId ? newType || undefined : undefined;

        await onSave(githubId, githubType);
      } catch (error) {
        console.error('Error saving GitHub info:', error);
        // Revert to previous values on error
        setPendingGithubId(initialGithubId || '');
      } finally {
        setIsSaving(false);
      }
    },
    [initialGithubId, initialGithubType, onSave]
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            GitHub User/Repository
          </label>
          <div className="space-y-3">
            <GitHubSearchComponent
              value={pendingGithubId}
              onChange={handleGithubChange}
              placeholder="Search for GitHub user or repository..."
            />

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </p>
            )}

            {(isLoading || isSaving) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-secondary"></div>
                {isSaving ? 'Saving...' : 'Loading...'}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Link your app to a GitHub user or repository. This dictates where
            the profits of your app will be sent. This should be a repository or
            user you control.
          </p>
        </div>
      </div>
    </div>
  );
}
