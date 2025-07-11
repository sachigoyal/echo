import { useState, useCallback, useEffect } from 'react';
import { useUpdateApp } from '../../../hooks/useUpdateApp';

export interface UseGitHubComponentReturn {
  githubId: string;
  githubType: 'user' | 'repo';
  setGithubId: (id: string) => void;
  setGithubType: (type: 'user' | 'repo') => void;
  update: () => Promise<void>;
  canGoNext: boolean;
  isUpdating: boolean;
  error: string | null;
}

export function useGitHubComponent(
  appId: string,
  initialGithubId: string = '',
  initialGithubType: 'user' | 'repo' = 'user'
): UseGitHubComponentReturn {
  const [githubId, setGithubId] = useState(initialGithubId);
  const [githubType, setGithubType] = useState<'user' | 'repo'>(
    initialGithubType
  );
  const { updateApp, isUpdating, error } = useUpdateApp();

  // Update state when initial values change
  useEffect(() => {
    setGithubId(initialGithubId);
  }, [initialGithubId]);

  useEffect(() => {
    setGithubType(initialGithubType);
  }, [initialGithubType]);

  const isValidGithubId = useCallback((id: string): boolean => {
    // GitHub usernames and repo names have specific rules:
    // - Can contain alphanumeric characters and hyphens
    // - Cannot start or end with a hyphen
    // - Cannot have consecutive hyphens
    // - Must be 1-39 characters long
    if (!id.trim()) return true; // Optional field

    const trimmedId = id.trim();
    const githubPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

    return (
      trimmedId.length >= 1 &&
      trimmedId.length <= 39 &&
      githubPattern.test(trimmedId) &&
      !trimmedId.includes('--') // No consecutive hyphens
    );
  }, []);

  // Validation logic
  const canGoNext = (() => {
    // Optional field - can proceed if empty
    if (!githubId.trim()) return true;
    // If value provided, must be valid GitHub ID
    return isValidGithubId(githubId.trim()) && !isUpdating;
  })();

  // Update method that performs the app update
  const handleGithubUpdate = useCallback(async (): Promise<void> => {
    if (!canGoNext) {
      throw new Error('Cannot proceed: Invalid GitHub ID');
    }

    try {
      const updateData: any = {};

      if (githubId.trim()) {
        updateData.githubId = githubId.trim();
        updateData.githubType = githubType;
      } else {
        // If githubId is empty, clear both fields
        updateData.githubId = null;
        updateData.githubType = null;
      }

      await updateApp(appId, updateData);
    } catch (error) {
      throw error; // Re-throw to be handled by navigation hook
    }
  }, [canGoNext, githubId, githubType, updateApp, appId]);

  return {
    githubId,
    githubType,
    setGithubId,
    setGithubType,
    update: handleGithubUpdate,
    canGoNext,
    isUpdating,
    error,
  };
}
