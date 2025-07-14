'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  const [pendingGithubType, setPendingGithubType] = useState<
    'user' | 'repo' | null
  >(initialGithubType);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle GitHub selection from search component - stabilized with useCallback
  const handleGithubChange = useCallback(
    (
      value: string,
      verified: boolean,
      metadata?: any,
      detectedType?: 'user' | 'repo'
    ) => {
      const newType = detectedType || null;

      // Only update if the value actually changed
      setPendingGithubId(prevId => {
        if (prevId === value) return prevId;
        return value;
      });

      setPendingGithubType(prevType => {
        if (prevType === newType) return prevType;
        return newType;
      });

      // Check for changes against initial values
      const hasIdChange = value !== (initialGithubId || '');
      const hasTypeChange = newType !== initialGithubType;
      setHasChanges(hasIdChange || hasTypeChange);
    },
    [initialGithubId, initialGithubType]
  );

  // Handle save action
  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    try {
      setIsSaving(true);
      const githubId = pendingGithubId.trim() || undefined;
      const githubType = githubId ? pendingGithubType || undefined : undefined;

      await onSave(githubId, githubType);

      // Reset changes flag after successful save
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving GitHub info:', error);
      // Don't reset hasChanges on error so user can retry
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, pendingGithubId, pendingGithubType, onSave]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    setPendingGithubId(initialGithubId || '');
    setPendingGithubType(initialGithubType);
    setHasChanges(false);
  }, [initialGithubId, initialGithubType]);

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

            {/* Save/Cancel buttons - only show when there are changes */}
            {hasChanges && !isLoading && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
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
