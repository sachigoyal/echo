import { useCallback, useRef } from 'react';
import { useCreateApp } from '../../../hooks/useCreateApp';
import { CreateApplicationStepRef } from '../CreateApplicationStep';

export interface UseCreateAppComponentReturn {
  stepRef: React.RefObject<CreateApplicationStepRef | null>;
  update: () => Promise<void>;
  canGoNext: boolean;
  isCreating: boolean;
  error: string | null;
}

export function useCreateAppComponent(): UseCreateAppComponentReturn {
  const stepRef = useRef<CreateApplicationStepRef>(null);
  const { createApp, isCreating, error } = useCreateApp();

  // Validation logic - check if we can proceed
  const canGoNext = !isCreating;

  // Update method that performs the app creation
  const handleCreateAppComponent = useCallback(async (): Promise<void> => {
    const appName = stepRef.current?.getValue() || '';

    if (!appName.trim()) {
      throw new Error('Cannot proceed: App name is required');
    }

    if (isCreating) {
      throw new Error('Cannot proceed: Already creating app');
    }

    try {
      await createApp({ name: appName.trim() });
    } catch (error) {
      throw error; // Re-throw to be handled by navigation hook
    }
  }, [createApp, isCreating]);

  return {
    stepRef,
    update: handleCreateAppComponent,
    canGoNext,
    isCreating,
    error,
  };
}
