import { useCallback, useRef } from 'react';
import { useCreateApp } from '../../../hooks/useCreateApp';
import { CreateApplicationStepRef } from '../CreateApplicationStep';
import { useUpdateApp } from '@/hooks/useUpdateApp';

export interface UseCreateAppComponentReturn {
  stepRef: React.RefObject<CreateApplicationStepRef | null>;
  update: () => Promise<void>;
  canGoNext: boolean;
  isCreating: boolean;
  error: string | null;
}

export function useCreateAppComponent(
  existingAppId?: string
): UseCreateAppComponentReturn {
  const stepRef = useRef<CreateApplicationStepRef>(null);
  const { createApp, isCreating, error: createError } = useCreateApp();
  const { updateApp, isUpdating, error: updateError } = useUpdateApp();

  const error = createError || updateError;

  // Validation logic - check if we can proceed
  const canGoNext = !isCreating && !isUpdating;

  // Update method that performs the app creation
  const handleCreateAppComponent = useCallback(async (): Promise<void> => {
    const appName = stepRef.current?.getValue() || '';

    if (!appName.trim()) {
      throw new Error('Cannot proceed: App name is required');
    }

    if (isCreating) {
      throw new Error('Cannot proceed: Already creating app');
    }
    if (existingAppId) {
      await updateApp(existingAppId, { name: appName.trim() });
    } else {
      await createApp({ name: appName.trim() });
    }

    try {
    } catch (error) {
      throw error; // Re-throw to be handled by navigation hook
    }
  }, [createApp, updateApp, existingAppId, isCreating]);

  return {
    stepRef,
    update: handleCreateAppComponent,
    canGoNext,
    isCreating,
    error,
  };
}
