import { useState, useCallback } from 'react';
import { useCreateApp } from '../../../hooks/useCreateApp';

export interface UseCreateAppComponentReturn {
  appName: string;
  setCurrentAppName: (name: string) => void;
  update: () => Promise<void>;
  canGoNext: boolean;
  isCreating: boolean;
  error: string | null;
}

export function useCreateAppComponent(): UseCreateAppComponentReturn {
  const [appName, setAppName] = useState('');
  const { createApp, isCreating, error } = useCreateApp();

  const setCurrentAppName = useCallback((name: string) => {
    setAppName(name);
  }, []);

  // Validation logic
  const canGoNext = appName.trim().length > 0 && !isCreating;

  // Update method that performs the app creation
  const handleCreateAppComponent = useCallback(async (): Promise<void> => {
    if (!canGoNext) {
      throw new Error('Cannot proceed: App name is required');
    }

    try {
      await createApp({ name: appName.trim() });
    } catch (error) {
      throw error; // Re-throw to be handled by navigation hook
    }
  }, [canGoNext, createApp, appName]);

  return {
    appName,
    setCurrentAppName,
    update: handleCreateAppComponent,
    canGoNext,
    isCreating,
    error,
  };
}
