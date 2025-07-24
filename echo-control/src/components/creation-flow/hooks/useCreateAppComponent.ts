import { useCallback, useRef } from 'react';
import { useCreateApp } from '../../../hooks/useCreateApp';
import { CreateApplicationStepRef } from '../CreateApplicationStep';
import { useUpdateApp } from '@/hooks/useUpdateApp';

export interface UseCreateAppComponentReturn {
  stepRef: React.RefObject<CreateApplicationStepRef | null>;
  update: () => Promise<string>;
  canGoNext: boolean;
  isCreating: boolean;
  error: string | null;
}

export function useCreateAppComponent(
  existingAppId?: string,
  onAppCreated?: (appId: string) => void
): UseCreateAppComponentReturn {
  const stepRef = useRef<CreateApplicationStepRef>(null);
  const { createApp, isCreating, error: createError } = useCreateApp();
  const { updateApp, isUpdating, error: updateError } = useUpdateApp();

  const error = createError || updateError;

  // Validation logic - check if we can proceed
  const canGoNext = !isCreating && !isUpdating;

  // Update method that performs the app creation
  const handleCreateAppComponent = useCallback(async (): Promise<string> => {
    const appName = stepRef.current?.getValue() || '';

    if (!appName.trim()) {
      throw new Error('Cannot proceed: App name is required');
    }

    if (isCreating) {
      throw new Error('Cannot proceed: Already creating app');
    }
    let appId: string;
    try {
      if (existingAppId) {
        appId = await updateApp(existingAppId, { name: appName.trim() });
      } else {
        appId = await createApp({ name: appName.trim() });
        // Notify parent component of the created app ID
        if (onAppCreated) {
          onAppCreated(appId);
        }
      }
      return appId;
    } catch (error) {
      throw error; // Re-throw to be handled by navigation hook
    }
  }, [createApp, updateApp, existingAppId, isCreating, onAppCreated]);

  return {
    stepRef,
    update: handleCreateAppComponent,
    canGoNext,
    isCreating,
    error,
  };
}
